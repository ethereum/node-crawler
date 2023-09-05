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

package crawler

import (
	"bytes"
	"encoding/base64"
	"encoding/hex"
	"net"
	"strconv"
	"strings"

	"github.com/ethereum/go-ethereum/p2p/enode"
	"github.com/ethereum/go-ethereum/p2p/enr"
	"github.com/ethereum/go-ethereum/rlp"
)

// parseNode parses a node record and verifies its signature.
func parseNode(source string) (*enode.Node, error) {
	if strings.HasPrefix(source, "enode://") {
		return enode.ParseV4(source)
	}
	r, err := parseRecord(source)
	if err != nil {
		return nil, err
	}
	return enode.New(enode.ValidSchemes, r)
}

// parseRecord parses a node record from hex, base64, or raw binary input.
func parseRecord(source string) (*enr.Record, error) {
	bin := []byte(source)
	if d, ok := decodeRecordHex(bytes.TrimSpace(bin)); ok {
		bin = d
	} else if d, ok := decodeRecordBase64(bytes.TrimSpace(bin)); ok {
		bin = d
	}
	var r enr.Record
	err := rlp.DecodeBytes(bin, &r)
	return &r, err
}

func decodeRecordHex(b []byte) ([]byte, bool) {
	if bytes.HasPrefix(b, []byte("0x")) {
		b = b[2:]
	}
	dec := make([]byte, hex.DecodedLen(len(b)))
	_, err := hex.Decode(dec, b)
	return dec, err == nil
}

func decodeRecordBase64(b []byte) ([]byte, bool) {
	if bytes.HasPrefix(b, []byte("enr:")) {
		b = b[4:]
	}
	dec := make([]byte, base64.RawURLEncoding.DecodedLen(len(b)))
	n, err := base64.RawURLEncoding.Decode(dec, b)
	return dec[:n], err == nil
}

// attrFormatters contains formatting functions for well-known ENR keys.
var attrFormatters = map[string]func(rlp.RawValue) (string, bool){
	"id":   formatAttrString,
	"ip":   formatAttrIP,
	"ip6":  formatAttrIP,
	"tcp":  formatAttrUint,
	"tcp6": formatAttrUint,
	"udp":  formatAttrUint,
	"udp6": formatAttrUint,
}

func formatAttrRaw(v rlp.RawValue) (string, bool) {
	s := hex.EncodeToString(v)
	return s, true
}

func formatAttrString(v rlp.RawValue) (string, bool) {
	content, _, err := rlp.SplitString(v)
	return strconv.Quote(string(content)), err == nil
}

func formatAttrIP(v rlp.RawValue) (string, bool) {
	content, _, err := rlp.SplitString(v)
	if err != nil || len(content) != 4 && len(content) != 6 {
		return "", false
	}
	return net.IP(content).String(), true
}

func formatAttrUint(v rlp.RawValue) (string, bool) {
	var x uint64
	if err := rlp.DecodeBytes(v, &x); err != nil {
		return "", false
	}
	return strconv.FormatUint(x, 10), true
}
