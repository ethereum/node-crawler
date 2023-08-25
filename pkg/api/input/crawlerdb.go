package input

import (
	"database/sql"
	"time"
)

type CrawledNode struct {
	ID              string
	Now             string
	ClientType      string
	SoftwareVersion uint64
	Capabilities    string
	NetworkID       uint64
	Country		string
	ForkID          string
}

func ReadRecentNodes(db *sql.DB, lastCheck time.Time) ([]CrawledNode, error) {
	queryStmt := "SELECT ID, Now, ClientType, SoftwareVersion, Capabilities, NetworkID, Country, " +
		"ForkID FROM nodes WHERE Now > ?"
	// TODO do a proper check here ^
	rows, err := db.Query(queryStmt, lastCheck.String())

	if err != nil {
		return nil, err
	}

	var nodes []CrawledNode
	for rows.Next() {
		var node CrawledNode
		err = rows.Scan(&node.ID, &node.Now, &node.ClientType, &node.SoftwareVersion, &node.Capabilities, &node.NetworkID, &node.Country, &node.ForkID,)
		if err != nil {
			return nil, err
		}
		nodes = append(nodes, node)
	}
	return nodes, nil
}
