package crawlerdb

import (
	"bytes"
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"

	"github.com/ethereum/go-ethereum/log"
	"github.com/ethereum/go-ethereum/p2p/enr"
	"github.com/ethereum/node-crawler/pkg/common"

	beacon "github.com/protolambda/zrnt/eth2/beacon/common"
	"github.com/protolambda/ztyp/codec"

	"github.com/oschwald/geoip2-golang"
)

// ETH2 is a SSZ encoded field.
type ETH2 []byte

func (v ETH2) ENRKey() string { return "eth2" }

func UpdateNodes(db *sql.DB, geoipDB *geoip2.Reader, nodes []common.NodeJSON) error {
	log.Info("Writing nodes to db", "nodes", len(nodes))

	now := time.Now()
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(
		`INSERT INTO nodes(
			ID,
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
			Country,
			City,
			Coordinates,
			FirstSeen,
			LastSeen,
			Seq,
			Score,
			ConnType
		) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
	)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, n := range nodes {
		info := &common.ClientInfo{}
		if n.Info != nil {
			info = n.Info
		}

		if info.ClientType == "" && n.TooManyPeers {
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
		fid := fmt.Sprintf("Hash: %v, Next %v", info.ForkID.Hash, info.ForkID.Next)

		var eth2 ETH2
		if n.N.Load(&eth2) == nil {
			info.ClientType = "eth2"
			var dat beacon.Eth2Data
			err = dat.Deserialize(codec.NewDecodingReader(bytes.NewReader(eth2), uint64(len(eth2))))
			if err == nil {
				fid = fmt.Sprintf("Hash: %v, Next %v", dat.ForkDigest, dat.NextForkEpoch)
			}
		}
		var caps string
		for _, c := range info.Capabilities {
			caps = fmt.Sprintf("%v, %v", caps, c.String())
		}
		var pk string
		if n.N.Pubkey() != nil {
			pk = fmt.Sprintf("X: %v, Y: %v", n.N.Pubkey().X.String(), n.N.Pubkey().Y.String())
		}

		var country, city, loc string
		if geoipDB != nil {
			// parse GeoIp info
			ipRecord, err := geoipDB.City(n.N.IP())
			if err != nil {
				return err
			}
			country, city, loc =
				ipRecord.Country.Names["en"],
				ipRecord.City.Names["en"],
				fmt.Sprintf("%v,%v", ipRecord.Location.Latitude, ipRecord.Location.Longitude)
		}

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
			country,
			city,
			loc,
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

func CreateDB(db *sql.DB) error {
	sqlStmt := `
	CREATE TABLE nodes (
		ID              TEXT NOT NULL,
		Now             TEXT NOT NULL,
		ClientType      TEXT,
		PK              TEXT,
		SoftwareVersion TEXT,
		Capabilities    TEXT,
		NetworkID       NUMBER,
		ForkID          TEXT,
		Blockheight     TEXT,
		TotalDifficulty TEXT,
		HeadHash        TEXT,
		IP              TEXT,
		Country         TEXT,
		City            TEXT,
		Coordinates     TEXT,
		FirstSeen       TEXT,
		LastSeen        TEXT,
		Seq             NUMBER,
		Score           NUMBER,
		ConnType        TEXT,
		PRIMARY KEY (ID, Now)
	);
	DELETE FROM nodes;
	`
	_, err := db.Exec(sqlStmt)
	return err
}
