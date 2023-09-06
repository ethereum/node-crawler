package crawlerdb

import (
	"database/sql"
)

type CrawledNode struct {
	ID              string
	Now             string
	ClientType      string
	SoftwareVersion uint64
	Capabilities    string
	NetworkID       uint64
	Country         string
	ForkID          string
}

func ReadAndDeleteUnseenNodes(db *sql.Tx) ([]CrawledNode, error) {
	queryStmt := `
		DELETE FROM nodes
		RETURNING
			ID,
			Now,
			ClientType,
			SoftwareVersion,
			Capabilities,
			NetworkID,
			Country,
			ForkID
	`
	rows, err := db.Query(queryStmt)

	if err != nil {
		return nil, err
	}

	var nodes []CrawledNode
	for rows.Next() {
		var node CrawledNode
		err = rows.Scan(
			&node.ID,
			&node.Now,
			&node.ClientType,
			&node.SoftwareVersion,
			&node.Capabilities,
			&node.NetworkID,
			&node.Country,
			&node.ForkID,
		)
		if err != nil {
			return nil, err
		}
		nodes = append(nodes, node)
	}
	return nodes, nil
}
