package vparser

import (
	"reflect"
	"testing"
)

func TestParseVersionString(t *testing.T) {
	type ParseTestCase struct {
		name string
		args string
		want *ParsedInfo
	}

	var test_data = []ParseTestCase{
		{
			name: "single",
			args: "geth",
			want: &ParsedInfo{
				Name: "geth",
			},
		},
		{
			name: "perfect-case",
			args: "Geth/v1.10.3-stable-991384a7/linux-amd64/go1.16.3",
			want: &ParsedInfo{
				Name: "geth",
				Version: Version{
					Major: 1,
					Minor: 10,
					Patch: 3,
					Tag:   "stable",
					Build: "991384a7",
				},
				Os: OSInfo{
					Os:           "linux",
					Architecture: "amd64",
				},
				Language: LanguageInfo{
					Name:    "go",
					Version: "1.16.3",
				},
			},
		},
		{
			name: "without-build",
			args: "Geth/v1.10.4-stable/linux-x64/go1.16.4",
			want: &ParsedInfo{
				Name: "geth",
				Version: Version{
					Major: 1,
					Minor: 10,
					Patch: 4,
					Tag:   "stable",
				},
				Os: OSInfo{
					Os:           "linux",
					Architecture: "x64",
				},
				Language: LanguageInfo{
					Name:    "go",
					Version: "1.16.4",
				},
			},
		},
		{
			name: "java",
			args: "besu/v21.7.0-RC1/darwin-x86_64/corretto-java-11",
			want: &ParsedInfo{
				Name: "besu",
				Version: Version{
					Major: 21,
					Minor: 7,
					Patch: 0,
					Tag:   "rc1",
				},
				Os: OSInfo{
					Os:           "darwin",
					Architecture: "x86_64",
				},
				Language: LanguageInfo{
					Name:    "java",
					Version: "11",
				},
			},
		},
		{
			name: "windows",
			args: "erigon/v2021.06.5-alpha-a0694dd3/windows-x86_64/go1.16.5",
			want: &ParsedInfo{
				Name: "erigon",
				Version: Version{
					Major: 2021,
					Minor: 06,
					Patch: 5,
					Tag:   "alpha",
					Build: "a0694dd3",
				},
				Os: OSInfo{
					Os:           "windows",
					Architecture: "x86_64",
				},
				Language: LanguageInfo{
					Name:    "go",
					Version: "1.16.5",
				},
			},
		},
		{
			name: "rust",
			args: "OpenEthereum/v3.2.6-stable-f9f4926-20210514/x86_64-linux-gnu/rustc1.52.1",
			want: &ParsedInfo{
				Name: "openethereum",
				Version: Version{
					Major: 3,
					Minor: 2,
					Patch: 6,
					Tag:   "stable",
					Build: "f9f4926",
					Date:  "20210514",
				},
				// This doesn't work
				// Os: OSInfo{
				// 	Os: "linux",
				// 	Architecture: "x86_64",
				// },
				Language: LanguageInfo{
					Name:    "rustc",
					Version: "1.52.1",
				},
			},
		},
		{
			name: "with-label",
			args: "Q-Client/v1.0.8-stable/Geth/v1.10.8-stable-825470ee/linux-amd64/go1.16.15",
			want: nil,
		},
		{
			name: "with-enode",
			args: "Geth/enode://91a3c3d5e76b0acf05d9abddee959f1bcbc7c91537d2629288a9edd7a3df90acaa46ffba0e0e5d49a20598e0960ac458d76eb8fa92a1d64938c0a3a3d60f8be4@127.0.0.1:21000/v1.10.0-stable(quorum-v22.1.0)/linux-amd64/go1.17.2",
			want: nil,
		},
	}

	for _, tt := range test_data {
		t.Run(tt.name, func(t *testing.T) {
			if got := ParseVersionString(tt.args); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ParseVersionString() = %v, want %v", got, tt.want)
			}
		})
	}
}
