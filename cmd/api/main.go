package main

import (
	"database/sql"
	"flag"
	"fmt"
	"os"
	"sync"
	"time"

	_ "modernc.org/sqlite"

	"github.com/ethereum/node-crawler/pkg/api"
	"github.com/ethereum/node-crawler/pkg/apidb"
	"github.com/ethereum/node-crawler/pkg/crawlerdb"
)

var (
	crawlerDBPath = flag.String("crawler-db-path", "nodetable", "Crawler Database SQLite Path")
	apiDBPath     = flag.String("api-db-path", "nodes", "API Database SQLite Path")
	dropNodesTime = flag.Duration("drop-time", 24*time.Hour, "Time to drop crawled nodes")
)

func main() {
	flag.Parse()

	crawlerDB, err := sql.Open("sqlite", *crawlerDBPath)
	if err != nil {
		panic(err)
	}
	shouldInit := false
	if _, err := os.Stat(*apiDBPath); os.IsNotExist(err) {
		shouldInit = true
	}
	nodeDB, err := sql.Open("sqlite", *apiDBPath)
	if err != nil {
		panic(err)
	}
	if shouldInit {
		fmt.Println("DB did not exist, init")
		if err := apidb.CreateDB(nodeDB); err != nil {
			panic(err)
		}
	}
	var wg sync.WaitGroup
	wg.Add(3)

	// Start reading deamon
	go newNodeDeamon(&wg, crawlerDB, nodeDB)
	go dropDeamon(&wg, nodeDB)

	// Start the API deamon
	apiDeamon := api.New(nodeDB)
	go apiDeamon.HandleRequests(&wg)
	wg.Wait()
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

func dropDeamon(wg *sync.WaitGroup, db *sql.DB) {
	defer wg.Done()
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for {
		<-ticker.C
		err := apidb.DropOldNodes(db, *dropNodesTime)
		if err != nil {
			panic(err)
		}
	}
}
