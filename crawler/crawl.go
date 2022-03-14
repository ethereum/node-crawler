// Copyright 2019 The go-ethereum Authors
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
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/core"
	"github.com/ethereum/go-ethereum/log"
	"github.com/ethereum/go-ethereum/p2p/enode"
)

type crawler struct {
	input  nodeSet
	output nodeSet

	genesis   *core.Genesis
	networkID uint64
	nodeURL   string

	disc resolver

	inputIter enode.Iterator
	iters     []enode.Iterator

	ch     chan *enode.Node
	closed chan struct{}

	// settings
	revalidateInterval time.Duration
}

type resolver interface {
	RequestENR(*enode.Node) (*enode.Node, error)
	RandomNodes() enode.Iterator
}

func newCrawler(genesis *core.Genesis, networkID uint64, nodeURL string, input nodeSet, disc resolver, iters ...enode.Iterator) *crawler {
	c := &crawler{
		input:     input,
		output:    make(nodeSet, len(input)),
		genesis:   genesis,
		networkID: networkID,
		nodeURL:   nodeURL,
		disc:      disc,
		iters:     iters,
		inputIter: enode.IterNodes(input.nodes()),
		ch:        make(chan *enode.Node),
		closed:    make(chan struct{}),
	}
	c.iters = append(c.iters, c.inputIter)
	// Copy input to output initially. Any nodes that fail validation
	// will be dropped from output during the run.
	for id, n := range input {
		c.output[id] = n
	}
	return c
}

func (c *crawler) run(timeout time.Duration) nodeSet {
	var (
		timeoutTimer = time.NewTimer(timeout)
		timeoutCh    <-chan time.Time
		doneCh       = make(chan enode.Iterator, len(c.iters))
		liveIters    = len(c.iters)
	)
	defer timeoutTimer.Stop()

	for _, it := range c.iters {
		go c.runIterator(doneCh, it)
	}

loop:
	for {
		select {
		case n := <-c.ch:
			c.updateNode(n)
		case it := <-doneCh:
			if it == c.inputIter {
				// Enable timeout when we're done revalidating the input nodes.
				log.Info("Revalidation of input set is done", "len", len(c.input))
				if timeout > 0 {
					timeoutCh = timeoutTimer.C
				}
			}
			if liveIters--; liveIters <= 0 {
				break loop
			}
		case <-timeoutCh:
			break loop
		}
	}

	close(c.closed)
	for _, it := range c.iters {
		it.Close()
	}
	for ; liveIters > 0; liveIters-- {
		<-doneCh
	}

	return c.output
}

func (c *crawler) runIterator(done chan<- enode.Iterator, it enode.Iterator) {
	defer func() { done <- it }()
	for it.Next() {
		select {
		case c.ch <- it.Node():
		case <-c.closed:
			return
		}
	}
}

func (c *crawler) updateNode(n *enode.Node) {
	node, ok := c.output[n.ID()]

	// Skip validation of recently-seen nodes.
	if ok && time.Since(node.LastCheck) < c.revalidateInterval {
		return
	}

	node.LastCheck = time.Now().UTC().Truncate(time.Second)

	// Request the node record.
	nn, err := c.disc.RequestENR(n)
	if err != nil {
		if node.Score == 0 {
			// Node doesn't implement EIP-868.
			log.Debug("Skipping node", "id", n.ID())
			return
		}
		node.Score /= 2
	} else {
		node.N = nn
		node.Seq = nn.Seq()
		node.Score++
		if node.FirstResponse.IsZero() {
			node.FirstResponse = node.LastCheck
		}
		node.LastResponse = node.LastCheck
	}

	node.Info, err = getClientInfo(c.genesis, c.networkID, c.nodeURL, node.N)
	if err != nil {
		log.Warn("GetClientInfo failed", "error", err, "nodeID", node.N.ID())
		if strings.Contains(err.Error(), "too many peers") {
			node.TooManyPeers = true
		}
	} else {
		log.Info("GetClientInfo succeeded")
		node.Score += 10
	}

	// Store/update node in output set.
	if node.Score <= 0 {
		log.Info("Removing node", "id", n.ID())
		delete(c.output, n.ID())
	} else {
		log.Info("Updating node", "id", n.ID(), "seq", n.Seq(), "score", node.Score)
		c.output[n.ID()] = node
	}
}
