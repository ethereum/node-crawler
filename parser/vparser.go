package parser

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

type Version struct {
	Major int
	Minor int
	Patch int
	Tag   string
	Build string
	Date  string
}

type OSInfo struct {
	Os           string
	Architecture string
}

type LanguageInfo struct {
	Name string
	Version string
}

type ParsedInfo struct {
	Name     string
	Label    string
	Version  Version
	Os       OSInfo
	Language LanguageInfo
}

var reLanguage = regexp.MustCompile(`(?P<name>[a-zA-Z]+)?-?(?P<version>[\d+.?]+)`)

func (p *ParsedInfo) String() string {
	return fmt.Sprintf("%v (%v) %v %v", p.Name, p.Version, p.Os, p.Language)
}

func ParseVersionString(input string) ParsedInfo {
	var output ParsedInfo
	// version string consists of four components, divided by /
	s := strings.Split(strings.ToLower(input), "/")
	l := len(s)
	output.Name = s[0]
	if output.Name == "" {
		output.Name = "unknown"
	}

	if l == 5 {
		output.Label = s[1]
		output.Version = parseVersion(s[2])
		output.Os = parseOS(s[3])
		output.Language = parseLanguage(s[4])
	} else if l == 4 {
		output.Version = parseVersion(s[1])
		output.Os = parseOS(s[2])
		output.Language = parseLanguage(s[3])
	}
	return output
}

func parseLanguage(input string) LanguageInfo {
	var languageInfo LanguageInfo
	match := reLanguage.FindStringSubmatch(input)

	if len(match) > 0 {
		languageInfo.Name = match[reLanguage.SubexpIndex("name")]
		languageInfo.Version = match[reLanguage.SubexpIndex("version")]
	}

	return languageInfo
}

func parseVersion(input string) Version {
	var vers Version
	split := strings.Split(input, "-")
	switch len(split) {
	case 4:
		// Date
		vers.Date = split[3]
		fallthrough
	case 3:
		// Build
		vers.Build = split[2]
		fallthrough
	case 2:
		// Tag
		vers.Tag = split[1]
		fallthrough
	case 1:
		// Version
		trimmed := strings.TrimLeft(split[0], "v")
		vSplit := strings.Split(trimmed, ".")
		if len(vSplit) != 3 {
			break
		}
		vers.Major, _ = strconv.Atoi(vSplit[0])
		vers.Minor, _ = strconv.Atoi(vSplit[1])
		vers.Patch, _ = strconv.Atoi(vSplit[2])
	}
	return vers
}

func parseOS(input string) OSInfo {
	split := strings.Split(input, "-")
	var osInfo OSInfo
	switch len(split) {
	case 2:
		osInfo.Architecture = split[1]
		fallthrough
	case 1:
		osInfo.Os = split[0]
	}
	return osInfo
}
