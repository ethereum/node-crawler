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
	output.Name = strings.ToLower(s[0])
	if output.Name == "" {
		output.Name = "tmp"
	}

	if l == 5 || l == 7 {
		output.Label = s[1]
		output.Version = parseVersion(s[2])
		output.Os = parseOS(s[3])
		output.Language = parseLanguage(s[4])
	} else if l == 4 {
		output.Version = parseVersion(s[1])
		output.Os = parseOS(s[2])
		output.Language = parseLanguage(s[3])
	} else if (l == 1 || l == 0) && (output.Name == "tmp" || output.Name == "eth2") {
		// These are usually "tmp" nodes that cannot be parsed.
	} else {
		fmt.Printf("Parser Error: Invalid length of '%d' for input: '%s'\n", l, input)
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
	split_length := len(split)
	switch len(split) {
	case 8:
		fallthrough
	case 7:
		fallthrough
	case 6:
		fallthrough
	case 5:
		vers.Date = split[split_length - 1]
		vers.Build = split[split_length - 2]
		vers.Tag = strings.Join(split[1:split_length - 3], "")
		vers.Major, vers.Minor, vers.Patch = parseVersionNumber(split[0])
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
		vers.Major, vers.Minor, vers.Patch = parseVersionNumber(split[0])
	}

	if vers.Major == 0 && vers.Minor == 0 && vers.Patch == 0 {
		fmt.Println(len(split), "Version string is invalid:", input)
	}
	
	return vers
}

func parseVersionNumber(input string) (int, int, int) {
	// Version
	trimmed := strings.TrimLeft(input, "v")
	vSplit := strings.Split(trimmed, ".")
	var major, minor, patch int

	switch len(vSplit) {
	case 4:
		fallthrough
	case 3:
		patch, _ = strconv.Atoi(vSplit[2])
		fallthrough
	case 2:
		minor, _ = strconv.Atoi(vSplit[1])
		fallthrough
	case 1:
		major, _ = strconv.Atoi(vSplit[0])
	}

	return major, minor, patch
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
