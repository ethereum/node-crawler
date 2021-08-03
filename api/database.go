package main

import (
	"database/sql"
	"fmt"

	"github.com/MariusVanDerWijden/node-crawler-backend/input"
	"github.com/MariusVanDerWijden/node-crawler-backend/parser"
)

func createDB(db *sql.DB) error {
	sqlStmt := `
	CREATE TABLE nodes (
		ID text not null, 
		name text,
		version_major number,
		version_minor number,
		version_patch number,
		version_tag text,
		version_build text,
		version_date text,
		os_name text,
		os_architecture text,
		language_name text,
		language_version text,
		PRIMARY KEY (ID)
	);
	delete from nodes;
	`
	_, err := db.Exec(sqlStmt)
	return err
}

func InsertCrawledNodes(db *sql.DB, crawledNodes []input.CrawledNode) error {
	fmt.Printf("Writing nodes to db: %v\n", len(crawledNodes))

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(
		`insert into nodes(
			ID, 
			name, 
			version_major, version_minor, version_patch, version_tag, version_build, version_date, 
			os_name, os_architecture, 
			language_name, language_version) 
			values(?,?,?,?,?,?,?,?,?,?,?,?)`)
	if err != nil {
		return err
	}

       crawledNodes = distinctNodes(crawledNodes)

	for _, node := range crawledNodes {
		parsed := parser.ParseVersionString(node.ClientType)
		_, err = stmt.Exec(
			node.ID,
			parsed.Name,
			parsed.Version.Major,
			parsed.Version.Minor,
			parsed.Version.Patch,
			parsed.Version.Tag,
			parsed.Version.Build,
			parsed.Version.Date,
			parsed.Os.Os,
			parsed.Os.Architecture,
			parsed.Language.Name,
			parsed.Language.Version,
		)
	}
	return tx.Commit()
}

func distinctNodes(nodes []input.CrawledNode) []input.CrawledNode {
       var res []input.CrawledNode
       for _, node := range nodes {
               newest := node
               for _, node2 := range nodes {
                       if node.ID == node2.ID {
                               if node2.Now > newest.Now {
                                       newest = node2
                               }
                       }
               }
               res = append(res, newest)
       }
       return res
}
