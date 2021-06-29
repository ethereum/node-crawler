package main

import (
	"database/sql"

	"github.com/MariusVanDerWijden/node-crawler-backend/input"
)

func createDB(db *sql.DB) error {
	sqlStmt := `
	CREATE TABLE nodes (
		ID text not null, 
		Now text not null,
		ClientType text,
		PK text,
		SoftwareVersion text,
		Capabilities text,
		NetworkID number,
		ForkID text,
		Blockheight text,
		TotalDifficulty text,
		HeadHash text,
		IP text,
		FirstSeen text,
		LastSeen text,
		Seq number,
		Score number,
		ConnType text,
		PRIMARY KEY (ID, Now)
	);
	delete from nodes;
	`
	_, err := db.Exec(sqlStmt)
	return err
}

func InsertCrawledNodes([]input.CrawledNode) error {
	return nil
}
