package main

import (
	"fmt"
	"strconv"
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

type OSInfo struct {
	os           string
	architecture string
}

type parsedInfo struct {
	name     string
	version  Version
	os       OSInfo
	language string
}

func (p *parsedInfo) String() string {
	return fmt.Sprintf("%v (%v) %v %v", p.name, p.version, p.os, p.language)
}

func ParseVersionString(input string) parsedInfo {
	var output parsedInfo
	// version string consists of four components, divided by /
	s := strings.Split(input, "/")
	switch len(s) {
	case 4:
		output.language = s[3]
		fallthrough
	case 3:
		output.os = parseOS(s[2])
		fallthrough
	case 2:
		output.version = parseVersion(s[1])
		fallthrough
	case 1:
		output.name = strings.ToLower(s[0])
		if output.name == "" {
			output.name = "unknown"
		}
	}
	return output
}

func parseVersion(input string) Version {
	var vers Version
	split := strings.Split(input, "-")
	switch len(split) {
	case 4:
		// Date
		vers.date = split[3]
		fallthrough
	case 3:
		// Build
		vers.build = split[2]
		fallthrough
	case 2:
		// Tag
		vers.tag = split[1]
		fallthrough
	case 1:
		// Version
		trimmed := strings.TrimLeft(split[0], "v")
		vSplit := strings.Split(trimmed, ".")
		if len(vSplit) != 3 {
			break
		}
		vers.major, _ = strconv.Atoi(vSplit[0])
		vers.minor, _ = strconv.Atoi(vSplit[1])
		vers.patch, _ = strconv.Atoi(vSplit[2])
	}
	return vers
}

func parseOS(input string) OSInfo {
	split := strings.Split(input, "-")
	var osInfo OSInfo
	switch len(split) {
	case 2:
		osInfo.os = split[0]
		fallthrough
	case 1:
		osInfo.architecture = split[1]
	}
	return osInfo
}
