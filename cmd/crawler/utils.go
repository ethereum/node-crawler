package main

import (
	"database/sql"
	"fmt"
)

func openSQLiteDB(
	name,
	autovacuum string,
	busyTimeout uint64,
) (*sql.DB, error) {
	db, err := sql.Open("sqlite", name)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %w", err)
	}
	_, err = db.Exec("PRAGMA auto_vacuum = " + autovacuum)
	if err != nil {
		return nil, fmt.Errorf("error setting auto_vacuum: %w", err)
	}
	_, err = db.Exec(fmt.Sprintf("PRAGMA busy_timeout = %d", busyTimeout))
	if err != nil {
		return nil, fmt.Errorf("error setting busy_timeout: %w", err)
	}

	return db, nil
}
