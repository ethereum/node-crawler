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
	router.HandleFunc("/v1/ready/london/count", a.handleLondonCount)
	router.HandleFunc("/v1/ready/london/clients", a.handleLondon)
	router.HandleFunc("/v1/ready/london/clients/{name}", a.handleLondon)

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

func (a *Api) handleLondon(rw http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	key := vars["name"]
	query := "SELECT * FROM nodes WHERE true "
	if key != "" {
		query = "SELECT * FROM nodes WHERE name = ? "
	}
	query = query + "AND" + createLondonQuery()
	nodes, err := nodeQuery(a.db, query, key)
	if err != nil {
		fmt.Println(err)
	}
	json.NewEncoder(rw).Encode(nodes)
}

func (a *Api) handleLondonCount(rw http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	key := vars["name"]
	query := "SELECT name, COUNT(name) FROM nodes WHERE true "
	if key != "" {
		query = "SELECT name, COUNT(name) FROM nodes WHERE name = ? "
	}
	query += "AND" + createLondonQuery()
	query += "GROUP BY name"
	// ready
	clients, err := clientQuery(a.db, query, key) //TODO handle err
	if err != nil {
		fmt.Println(err)
	}
	// not ready
	query = "SELECT name, COUNT(name) FROM nodes WHERE true "
	if key != "" {
		query = "SELECT name, COUNT(name) FROM nodes WHERE name = ? "
	}
	query += "AND NOT" + createLondonQuery()
	query += "GROUP BY name"
	clients2, err := clientQuery(a.db, query, key) //TODO handle err
	if err != nil {
		fmt.Println(err)
	}
	type result struct {
		Ready    []client
		NotReady []client
	}
	json.NewEncoder(rw).Encode(result{Ready: clients, NotReady: clients2})
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

func createLondonQuery() string {
	query := "("
	type cl struct {
		name  string
		major int
		minor int
		patch int
	}
	// Testnets: https://blog.ethereum.org/2021/06/18/london-testnets-announcement/
	clients := []cl{
		{"geth", 1, 10, 4},
		{"nethermind", 1, 10, 73},
		{"turbogeth", 2021, 6, 4},
		{"turbo-geth", 2021, 6, 4},
		{"erigon", 2021, 6, 4},
		{"besu", 21, 7, 0},
		{"openethereum", 3, 3, 0},
		{"ethereum-js", 5, 4, 1},
	}
	for i, cl := range clients {
		major := fmt.Sprintf("major > %v", cl.major)
		minor := fmt.Sprintf("major == %v AND minor > %v", cl.major, cl.minor)
		patch := fmt.Sprintf("major == %v AND minor == %v AND patch >= %v", cl.major, cl.minor, cl.patch)
		inner := fmt.Sprintf("(%v) OR (%v) OR (%v)", major, minor, patch)
		query += fmt.Sprintf("(name == \"%v\" AND (%v))", cl.name, inner)
		if i < len(clients)-1 {
			query += " OR "
		}
	}
	query += ")"
	return query
}
