package main

import (
	"time"

	"github.com/urfave/cli/v2"
)

var (
	apiDBFlag = &cli.StringFlag{
		Name:     "api-db",
		Usage:    "API SQLite file name",
		Required: true,
	}
	apiListenAddrFlag = &cli.StringFlag{
		Name:  "addr",
		Usage: "Listening address",
		Value: "0.0.0.0:10000",
	}
	autovacuumFlag = &cli.StringFlag{
		Name: "autovacuum",
		Usage: ("Sets the autovacuum value for the databases. Possible values: " +
			"NONE, FULL, or INCREMENTAL. " +
			"https://www.sqlite.org/pragma.html#pragma_auto_vacuum"),
		Value: "INCREMENTAL",
	}
	bootnodesFlag = &cli.StringSliceFlag{
		Name: "bootnodes",
		Usage: ("Comma separated nodes used for bootstrapping. " +
			"Defaults to hard-coded values for the selected network"),
	}
	busyTimeoutFlag = &cli.Uint64Flag{
		Name: "busy-timeout",
		Usage: ("Sets the busy_timeout value for the database in milliseconds. " +
			"https://www.sqlite.org/pragma.html#pragma_busy_timeout"),
		Value: 3000,
	}
	crawlerDBFlag = &cli.StringFlag{
		Name:     "crawler-db",
		Usage:    "Crawler SQLite file name",
		Required: true,
	}
	dropNodesTimeFlag = &cli.DurationFlag{
		Name:  "drop-time",
		Usage: "Time to drop crawled nodes without any updates",
		Value: 24 * time.Hour,
	}
	geoipdbFlag = &cli.StringFlag{
		Name:  "geoipdb",
		Usage: "geoip2 database location",
	}
	listenAddrFlag = &cli.StringFlag{
		Name:  "addr",
		Usage: "Listening address",
		Value: "0.0.0.0:0",
	}
	nodedbFlag = &cli.StringFlag{
		Name:  "nodedb",
		Usage: "Nodes database location. Defaults to in memory database",
	}
	nodeFileFlag = &cli.StringFlag{
		Name:  "nodefile",
		Usage: "Path to a node file containing nodes to be crawled",
	}
	nodekeyFlag = &cli.StringFlag{
		Name:  "nodekey",
		Usage: "Hex-encoded node key",
	}
	nodeURLFlag = &cli.StringFlag{
		Name:  "nodeURL",
		Usage: "URL of the node you want to connect to",
		// Value: "http://localhost:8545",
	}
	timeoutFlag = &cli.DurationFlag{
		Name:  "timeout",
		Usage: "Timeout for the crawling in a round",
		Value: 5 * time.Minute,
	}
	workersFlag = &cli.Uint64Flag{
		Name:  "workers",
		Usage: "Number of workers to start for updating nodes",
		Value: 16,
	}
)
