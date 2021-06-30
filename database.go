package main

import (
	"database/sql"
	"fmt"

	"github.com/MariusVanDerWijden/node-crawler-backend/input"
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
		language text,
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
			language) 
			values(?,?,?,?,?,?,?,?,?,?,?)`)
	if err != nil {
		return err
	}

	for _, node := range crawledNodes {
		parsed := ParseVersionString(node.ClientType)
		fmt.Println(parsed)
		_, err = stmt.Exec(
			node.ID,
			parsed.name,
			parsed.version.major,
			parsed.version.minor,
			parsed.version.patch,
			parsed.version.tag,
			parsed.version.build,
			parsed.version.date,
			parsed.os.os,
			parsed.os.architecture,
			parsed.language,
		)
	}
	return tx.Commit()
}
