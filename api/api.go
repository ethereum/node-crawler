package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/MariusVanDerWijden/node-crawler-backend/parser"
	"github.com/gorilla/mux"
)

type Api struct {
	db *sql.DB
}

func New(sdb *sql.DB) *Api {
	return &Api{db: sdb}
}

func (a *Api) HandleRequests() {
	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/", func(rw http.ResponseWriter, r *http.Request) { rw.Write([]byte("Hello")) })
	router.HandleFunc("/v1/clients/count", a.handleClient)
	router.HandleFunc("/v1/clients/count/{name}", a.handleClient)
	router.HandleFunc("/v1/clients", a.handleAll)
	router.HandleFunc("/v1/clients/{name}", a.handleAll)

	http.ListenAndServe(":10000", router)
}

type client struct {
	Name  string
	Count int
}

type node struct {
	ID string
	parser.ParsedInfo
}

// handles the aggregated client endpoint
func (a *Api) handleClient(rw http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	key := vars["name"]
	query := "SELECT name, COUNT(name) FROM nodes GROUP BY name"
	if key != "" {
		query = "SELECT name, COUNT(name) FROM nodes WHERE name = ? GROUP BY name"
	}
	clients, err := clientQuery(a.db, query, key) //TODO handle err
	if err != nil {
		fmt.Println(err)
	}
	json.NewEncoder(rw).Encode(clients)
}
func (a *Api) handleAll(rw http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	key := vars["name"]
	query := "SELECT * FROM nodes"
	if key != "" {
		query = "SELECT * FROM nodes WHERE name = ?"
	}
	nodes, err := nodeQuery(a.db, query, key)
	if err != nil {
		fmt.Println(err)
	}
	json.NewEncoder(rw).Encode(nodes)
}

func clientQuery(db *sql.DB, query string, args ...interface{}) ([]client, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	var clients []client
	for rows.Next() {
		var cl client
		err = rows.Scan(&cl.Name, &cl.Count)
		if err != nil {
			return nil, err
		}
		clients = append(clients, cl)
	}
	return clients, nil
}

func nodeQuery(db *sql.DB, query string, args ...interface{}) ([]node, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	var nodes []node
	for rows.Next() {
		var p node
		err = rows.Scan(&p.ID, &p.Name,
			&p.Version.Major, &p.Version.Minor, &p.Version.Patch,
			&p.Version.Tag, &p.Version.Build, &p.Version.Date,
			&p.Os.Os, &p.Os.Architecture,
			&p.Language,
		)
		if err != nil {
			return nil, err
		}
		nodes = append(nodes, p)
	}
	return nodes, nil
}
