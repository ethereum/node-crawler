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

	_ "modernc.org/sqlite"

	"github.com/oschwald/geoip2-golang"

	"github.com/ethereum/go-ethereum/cmd/utils"
	gethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/log"
	"github.com/ethereum/go-ethereum/p2p/enode"
	"github.com/ethereum/node-crawler/pkg/common"
	"github.com/ethereum/node-crawler/pkg/crawler"
	"github.com/ethereum/node-crawler/pkg/crawlerdb"

	"github.com/urfave/cli/v2"
)

var (
	crawlerCommand = &cli.Command{
		Name:   "crawl",
		Usage:  "Crawl the ethereum network",
		Action: crawlNodes,
		Flags: []cli.Flag{
			autovacuumFlag,
			bootnodesFlag,
			busyTimeoutFlag,
			crawlerDBFlag,
			geoipdbFlag,
			listenAddrFlag,
			nodeFileFlag,
			nodeURLFlag,
			nodedbFlag,
			nodekeyFlag,
			timeoutFlag,
			workersFlag,
			utils.HoodiFlag,
			utils.NetworkIdFlag,
			utils.SepoliaFlag,
		},
	}
)

func crawlNodes(ctx *cli.Context) error {
	var inputSet common.NodeSet
	var geoipDB *geoip2.Reader

	nodesFile := ctx.String(nodeFileFlag.Name)

	if nodesFile != "" && gethCommon.FileExist(nodesFile) {
		inputSet = common.LoadNodesJSON(nodesFile)
	}

	var db *sql.DB
	if ctx.IsSet(crawlerDBFlag.Name) {
		name := ctx.String(crawlerDBFlag.Name)
		shouldInit := false
		if _, err := os.Stat(name); os.IsNotExist(err) {
			shouldInit = true
		}

		var err error
		db, err = openSQLiteDB(
			name,
			ctx.String(autovacuumFlag.Name),
			ctx.Uint64(busyTimeoutFlag.Name),
		)
		if err != nil {
			panic(err)
		}
		log.Info("Connected to db")
		if shouldInit {
			log.Info("DB did not exist, init")
			if err := crawlerdb.CreateDB(db); err != nil {
				panic(err)
			}
		}
	}

	nodeDB, err := enode.OpenDB(ctx.String(nodedbFlag.Name))
	if err != nil {
		panic(err)
	}

	if geoipFile := ctx.String(geoipdbFlag.Name); geoipFile != "" {
		geoipDB, err = geoip2.Open(geoipFile)
		if err != nil {
			return err
		}
		defer func() { _ = geoipDB.Close() }()
	}

	crawler := crawler.Crawler{
		NetworkID:  ctx.Uint64(utils.NetworkIdFlag.Name),
		NodeURL:    ctx.String(nodeURLFlag.Name),
		ListenAddr: ctx.String(listenAddrFlag.Name),
		NodeKey:    ctx.String(nodekeyFlag.Name),
		Bootnodes:  ctx.StringSlice(bootnodesFlag.Name),
		Timeout:    ctx.Duration(timeoutFlag.Name),
		Workers:    ctx.Uint64(workersFlag.Name),
		Sepolia:    ctx.Bool(utils.SepoliaFlag.Name),
		Hoodi:      ctx.Bool(utils.HoodiFlag.Name),
		NodeDB:     nodeDB,
	}

	for {
		updatedSet := crawler.CrawlRound(inputSet, db, geoipDB)
		if nodesFile != "" {
			updatedSet.WriteNodesJSON(nodesFile)
		}
	}
}
