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
		major number,
		minor number,
		patch number,
		tag text,
		build text,
		date text,
		os text,
		architecture text,
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
	fmt.Printf("Writing nodes to db: %v", len(crawledNodes))

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(
		`insert into nodes(
			ID, 
			name, 
			major, minor, patch, tag, build, date, 
			os, architecture, 
			language_name, language_version) 
			values(?,?,?,?,?,?,?,?,?,?,?,?)`)
	if err != nil {
		return err
	}

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
