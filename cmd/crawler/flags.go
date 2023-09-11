package main

import (
	"github.com/urfave/cli/v2"
)

var (
	autovacuumFlag = cli.StringFlag{
		Name: "autovacuum",
		Usage: ("Sets the autovacuum value for the databases. Possible values: " +
			"NONE, FULL, or INCREMENTAL. " +
			"https://www.sqlite.org/pragma.html#pragma_auto_vacuum"),
		Value: "INCREMENTAL",
	}
	busyTimeoutFlag = cli.Uint64Flag{
		Name: "busy-timeout",
		Usage: ("Sets the busy_timeout value for the database in milliseconds. " +
			"https://www.sqlite.org/pragma.html#pragma_busy_timeout"),
		Value: 3000,
	}
)
