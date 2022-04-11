// Copyright 2021 The go-ethereum Authors
// This file is part of the go-ethereum library.
//
// The go-ethereum library is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// The go-ethereum library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with the go-ethereum library. If not, see <http://www.gnu.org/licenses/>.

package main

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/urfave/cli.v1"
)

var (
	app = &cli.App{
		Name:        filepath.Base(os.Args[0]),
		Usage:       "go-ethereum crawler",
		Version:     "v.0.0.1",
		Writer:      os.Stdout,
		HideVersion: true,
	}
)

func init() {
	app.Flags = append(app.Flags, Flags...)
	app.Before = func(ctx *cli.Context) error {
		return Setup(ctx)
	}
	// Set up the CLI app.
	app.CommandNotFound = func(ctx *cli.Context, cmd string) {
		fmt.Fprintf(os.Stderr, "No such command: %s\n", cmd)
		os.Exit(1)
	}
	// Add subcommands.
	app.Commands = []cli.Command{
		crawlerCommand,
	}
}

func main() {
	err := app.Run(os.Args)
	if err != nil {
		panic(err)
	}
}
