package main

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"

	"github.com/MariusVanDerWijden/node-crawler-backend/input"
)

func main() {
	crawlerDB, err := sql.Open("sqlite3", "table")
	if err != nil {
		panic(err)
	}
	nodeDB, err := sql.Open("sqlite3", "nodes")
	if err != nil {
		panic(err)
	}
	// Start reading deamon
	go deamon(crawlerDB, nodeDB)
}

// Deamon reads new nodes from the crawler and puts them in the db
// Might trigger the invalidation of caches for the api in the future
func deamon(crawlerDB, nodeDB *sql.DB) {
	lastCheck := time.Now()
	for {
		nodes, err := input.ReadRecentNodes(crawlerDB, lastCheck)
		if err != nil {
			fmt.Printf(err.Error())
			return
		}
		lastCheck = time.Now()
		InsertCrawledNodes(nodes)
	}
}
