package main

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"

	"github.com/ethereum/go-ethereum/log"
	"github.com/ethereum/go-ethereum/p2p/enr"
)

func updateNodes(db *sql.DB, nodes []crawledNode) error {
	log.Info("Writing nodes to db", "nodes", len(nodes))
	now := time.Now()
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(
		`insert into nodes(ID, 
			Now,
			ClientType,
			PK,
			SoftwareVersion,
			Capabilities,
			NetworkID,
			ForkID,
			Blockheight,
			TotalDifficulty,
			HeadHash,
			IP,
			FirstSeen,
			LastSeen,
			Seq,
			Score,
			ConnType) 
			values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
	if err != nil {
		return err
	}
	defer stmt.Close()
	for _, node := range nodes {
		n := node.node
		info := &clientInfo{}
		if node.info != nil {
			info = node.info
		}
		if info.ClientType == "" && node.tooManyPeers {
			info.ClientType = "tmp"
		}
		connType := ""
		var portUDP enr.UDP
		if n.N.Load(&portUDP) == nil {
			connType = "UDP"
		}
		var portTCP enr.TCP
		if n.N.Load(&portTCP) == nil {
			connType = "TCP"
		}
		var eth2 ETH2
		if n.N.Load((&eth2)) == nil {
			info.ClientType = "eth2"
		}
		var caps string
		for _, c := range info.Capabilities {
			caps = fmt.Sprintf("%v, %v", caps, c.String())
		}
		var pk string
		if n.N.Pubkey() != nil {
			pk = fmt.Sprintf("X: %v, Y: %v", n.N.Pubkey().X.String(), n.N.Pubkey().Y.String())
		}
		fid := fmt.Sprintf("Hash: %v, Next %v", info.ForkID.Hash, info.ForkID.Next)

		_, err = stmt.Exec(
			n.N.ID().String(),
			now.String(),
			info.ClientType,
			pk,
			info.SoftwareVersion,
			caps,
			info.NetworkID,
			fid,
			info.Blockheight,
			info.TotalDifficulty.String(),
			info.HeadHash.String(),
			n.N.IP().String(),
			n.FirstResponse.String(),
			n.LastResponse.String(),
			n.Seq,
			n.Score,
			connType,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

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
