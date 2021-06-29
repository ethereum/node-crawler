package main

import "testing"

func TestParsing(t *testing.T) {
	tests := []string{
		"Geth/v1.10.3-stable-991384a7/linux-amd64/go1.16.3",
		"Geth/v1.10.4-stable/linux-x64/go1.16.4",
		"besu/v21.7.0-RC1/darwin-x86_64/corretto-java-11",
		"erigon/v2021.06.5-alpha-a0694dd3/windows-x86_64/go1.16.5",
		"OpenEthereum/v3.2.6-stable-f9f4926-20210514/x86_64-linux-gnu/rustc1.52.1",
	}
	_ = tests
}
