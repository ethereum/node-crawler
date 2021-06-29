package main

import (
	"strings"
)

type Version struct {
	major int
	minor int
	patch int
	tag   string
	build string
	date  string
}

type parsedInfo struct {
	name     string
	version  Version
	os       string
	language string
}

func ParseVersionString(input string) parsedInfo {
	var output parsedInfo
	// version string consists of four components, divided by /
	s := strings.Split(input, "/")
	if len(s) != 4 {
		return output
	}
	output.name = s[0]
	output.version = parseVersion(s[1])
	return output
}

func parseVersion(input string) Version {
	return Version{}
}
