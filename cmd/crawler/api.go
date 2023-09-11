package main

import (
	"database/sql"
	"fmt"
	"os"
	"sync"
	"time"

	_ "modernc.org/sqlite"

	"github.com/ethereum/node-crawler/pkg/api"
	"github.com/ethereum/node-crawler/pkg/apidb"
	"github.com/ethereum/node-crawler/pkg/crawlerdb"
	"github.com/urfave/cli/v2"
)

var (
	apiCommand = &cli.Command{
		Name:   "api",
		Usage:  "API server for the crawler",
		Action: startAPI,
		Flags: []cli.Flag{
			&apiDBFlag,
			&apiListenAddrFlag,
			&autovacuumFlag,
			&busyTimeoutFlag,
			&crawlerDBFlag,
			&dropNodesTimeFlag,
		},
	}
)

func startAPI(ctx *cli.Context) error {
	autovacuum := ctx.String(autovacuumFlag.Name)
	busyTimeout := ctx.Uint64(busyTimeoutFlag.Name)

	crawlerDB, err := openSQLiteDB(
		ctx.String(crawlerDBFlag.Name),
		autovacuum,
		busyTimeout,
	)
	if err != nil {
		return err
	}

	apiDBPath := ctx.String(apiDBFlag.Name)
	shouldInit := false
	if _, err := os.Stat(apiDBPath); os.IsNotExist(err) {
		shouldInit = true
	}
	nodeDB, err := openSQLiteDB(
		apiDBPath,
		autovacuum,
		busyTimeout,
	)
	if err != nil {
		return err
	}
	if shouldInit {
		fmt.Println("DB did not exist, init")
		if err := apidb.CreateDB(nodeDB); err != nil {
			return err
		}
	}
	var wg sync.WaitGroup
	wg.Add(3)

	// Start reading deamon
	go newNodeDeamon(&wg, crawlerDB, nodeDB)
	go dropDeamon(&wg, nodeDB, ctx.Duration(dropNodesTimeFlag.Name))

	// Start the API deamon
	apiAddress := ctx.String(apiListenAddrFlag.Name)
	apiDeamon := api.New(apiAddress, nodeDB)
	go apiDeamon.HandleRequests(&wg)
	wg.Wait()

	return nil
}

// newNodeDeamon reads new nodes from the crawler and puts them in the db
// Might trigger the invalidation of caches for the api in the future
func newNodeDeamon(wg *sync.WaitGroup, crawlerDB, nodeDB *sql.DB) {
	defer wg.Done()
	lastCheck := time.Time{}
	for {
		nodes, err := crawlerdb.ReadRecentNodes(crawlerDB, lastCheck)
		if err != nil {
			fmt.Printf("Error reading nodes: %v\n", err)
			return
		}
		lastCheck = time.Now()
		if len(nodes) > 0 {
			err := apidb.InsertCrawledNodes(nodeDB, nodes)
			if err != nil {
				fmt.Printf("Error inserting nodes: %v\n", err)
			}
			fmt.Printf("%d nodes inserted\n", len(nodes))
		}
		time.Sleep(time.Second)
	}
}

func dropDeamon(wg *sync.WaitGroup, db *sql.DB, dropTimeout time.Duration) {
	defer wg.Done()
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for {
		<-ticker.C
		err := apidb.DropOldNodes(db, dropTimeout)
		if err != nil {
			panic(err)
		}
	}
}
