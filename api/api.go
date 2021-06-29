package api

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

type api struct {
	db *sql.DB
}

func (a *api) handleRequests() {
	http.HandleFunc("/", func(rw http.ResponseWriter, r *http.Request) {})
	http.HandleFunc("/v1/clients", a.handleClients)
	http.HandleFunc("/v1/clients/{name}", a.handleClient)
}

type client struct {
	name  string
	count int
}

// handles the clients endpoint
func (a *api) handleClients(rw http.ResponseWriter, r *http.Request) {
	query := "SELECT name, COUNT(name) FROM nodes GROUP BY name"
	clients, _ := clientQuery(a.db, query) //TODO handle err
	json.NewEncoder(rw).Encode(clients)
}

func (a *api) handleClient(rw http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	key := vars["name"]
	query := "SELECT name, COUNT(name) FROM nodes WHERE name = ? GROUP BY name"
	clients, _ := clientQuery(a.db, query, key) //TODO handle err
	json.NewEncoder(rw).Encode(clients)
}

func clientQuery(db *sql.DB, query string, args ...interface{}) ([]client, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}

	var clients []client
	for rows.Next() {
		var cl client
		err = rows.Scan(&cl.name, &cl.count)
		if err != nil {
			return nil, err
		}
		clients = append(clients, cl)
	}
	return clients, nil
}
