// Copyright 2021 The go-ethereum Authors
// This file is part of go-ethereum.
//
// go-ethereum is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// go-ethereum is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with go-ethereum. If not, see <http://www.gnu.org/licenses/>.

package main

import (
	"database/sql"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/p2p/enode"
	_ "github.com/mattn/go-sqlite3"

	"github.com/ethereum/go-ethereum/cmd/utils"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core"
	"github.com/ethereum/go-ethereum/log"
	"github.com/ethereum/go-ethereum/p2p/discover"

	"gopkg.in/urfave/cli.v1"
)

var (
	crawlerCommand = cli.Command{
		Name:      "crawl",
		Usage:     "Crawl the ethereum network",
		ArgsUsage: "<nodefile>",
		Action:    crawlNodes,
		Flags: []cli.Flag{
			utils.MainnetFlag,
			utils.RopstenFlag,
			utils.RinkebyFlag,
			utils.GoerliFlag,
			utils.NetworkIdFlag,
			bootnodesFlag,
			nodeURLFlag,
			nodeFileFlag,
			timeoutFlag,
			tableNameFlag,
			listenAddrFlag,
			nodekeyFlag,
			nodedbFlag,
		},
	}
	bootnodesFlag = cli.StringFlag{
		Name:  "bootnodes",
		Usage: "Comma separated nodes used for bootstrapping",
	}
	nodeURLFlag = cli.StringFlag{
		Name:  "nodeURL",
		Usage: "URL of the node you want to connect to",
		// Value: "http://localhost:8545",
	}
	nodeFileFlag = cli.StringFlag{
		Name:  "nodefile",
		Usage: "Path to a node file containing nodes to be crawled",
	}
	timeoutFlag = cli.DurationFlag{
		Name:  "timeout",
		Usage: "Timeout for the crawling in a round",
		Value: 5 * time.Minute,
	}
	tableNameFlag = cli.StringFlag{
		Name:  "table",
		Usage: "Name of the sqlite table",
	}
	listenAddrFlag = cli.StringFlag{
		Name:  "addr",
		Usage: "Listening address",
	}
	nodekeyFlag = cli.StringFlag{
		Name:  "nodekey",
		Usage: "Hex-encoded node key",
	}
	nodedbFlag = cli.StringFlag{
		Name:  "nodedb",
		Usage: "Nodes database location",
	}
)

type crawledNode struct {
	node         nodeJSON
	info         *clientInfo
	tooManyPeers bool
}

func crawlNodes(ctx *cli.Context) error {
	var inputSet nodeSet

	if nodesFile := ctx.String(nodeFileFlag.Name); nodesFile != "" && common.FileExist(nodesFile) {
		inputSet = loadNodesJSON(nodesFile)
	}

	var db *sql.DB
	if ctx.IsSet(tableNameFlag.Name) {
		name := ctx.String(tableNameFlag.Name)
		shouldInit := false
		if _, err := os.Stat(name); os.IsNotExist(err) {
			shouldInit = true
		}
		var err error
		if db, err = sql.Open("sqlite3", name); err != nil {
			panic(err)
		}
		log.Info("Connected to db")
		if shouldInit {
			log.Info("DB did not exist, init")
			if err := createDB(db); err != nil {
				panic(err)
			}
		}
	}

	timeout := ctx.Duration(timeoutFlag.Name)

	for {
		inputSet = crawlRound(ctx, inputSet, db, timeout)
		if nodesFile := ctx.String(nodeFileFlag.Name); nodesFile != "" && common.FileExist(nodesFile) {
			writeNodesJSON(nodesFile, inputSet)
		}
	}
}

func crawlRound(ctx *cli.Context, inputSet nodeSet, db *sql.DB, timeout time.Duration) nodeSet {
	output := make(nodeSet)

	dbpath := ctx.String(nodedbFlag.Name)
	nodeDB, err := enode.OpenDB(dbpath)
	if err != nil {
		panic(err)
	}

	v5 := discv5(ctx, nodeDB, inputSet, timeout)
	output.add(v5.nodes()...)
	log.Info("DiscV5", "nodes", len(v5.nodes()))

	v4 := discv4(ctx, nodeDB, inputSet, timeout)
	output.add(v4.nodes()...)
	log.Info("DiscV4", "nodes", len(v4.nodes()))

	genesis := makeGenesis(ctx)
	if genesis == nil {
		genesis = core.DefaultGenesisBlock()
	}
	networkID := ctx.Uint64(utils.NetworkIdFlag.Name)
	nodeURL := ctx.String(nodeURLFlag.Name)

	reqChan := make(chan nodeJSON, len(output))
	respChan := make(chan crawledNode, 10)
	getNodeLoop := func(in <-chan nodeJSON, out chan<- crawledNode) {
		for {
			node := <-in
			info, err := getClientInfo(genesis, networkID, nodeURL, node.N)
			tooManyPeers := false
			if err != nil {
				log.Warn("GetClientInfo failed", "error", err, "nodeID", node.N.ID())
				if strings.Contains(err.Error(), "too many peers") {
					tooManyPeers = true
				}
			} else {
				log.Info("GetClientInfo succeeded")
			}
			out <- crawledNode{node: node, info: info, tooManyPeers: tooManyPeers}
		}
	}
	// Schedule 10 workers
	for i := 0; i < 10; i++ {
		go getNodeLoop(reqChan, respChan)
	}

	// Try to connect and get the status of all nodes
	for _, node := range output {
		reqChan <- node
	}
	var nodes []crawledNode
	for i := 0; i < len(output); i++ {
		node := <-respChan
		nodes = append(nodes, node)
	}
	// Write the node info to influx
	if db != nil {
		if err := updateNodes(db, nodes); err != nil {
			panic(err)
		}
	}
	return output
}

func discv5(ctx *cli.Context, db *enode.DB, inputSet nodeSet, timeout time.Duration) nodeSet {
	ln, config := makeDiscoveryConfig(ctx, db)

	socket := listen(ln, ctx.String(listenAddrFlag.Name))

	disc, err := discover.ListenV5(socket, ln, config)
	if err != nil {
		panic(err)
	}
	defer disc.Close()

	// Crawl the DHT for some time
	c := newCrawler(inputSet, disc, disc.RandomNodes())
	c.revalidateInterval = 10 * time.Minute
	return c.run(timeout)
}

func discv4(ctx *cli.Context, db *enode.DB, inputSet nodeSet, timeout time.Duration) nodeSet {
	ln, config := makeDiscoveryConfig(ctx, db)

	socket := listen(ln, ctx.String(listenAddrFlag.Name))

	disc, err := discover.ListenV4(socket, ln, config)
	if err != nil {
		panic(err)
	}
	defer disc.Close()

	// Crawl the DHT for some time
	c := newCrawler(inputSet, disc, disc.RandomNodes())
	c.revalidateInterval = 10 * time.Minute
	return c.run(timeout)
}

// makeGenesis is the pendant to utils.MakeGenesis
// with local flags instead of global flags.
func makeGenesis(ctx *cli.Context) *core.Genesis {
	switch {
	case ctx.Bool(utils.RopstenFlag.Name):
		return core.DefaultRopstenGenesisBlock()
	case ctx.Bool(utils.RinkebyFlag.Name):
		return core.DefaultRinkebyGenesisBlock()
	case ctx.Bool(utils.GoerliFlag.Name):
		return core.DefaultGoerliGenesisBlock()
	default:
		return core.DefaultGenesisBlock()
	}
}
