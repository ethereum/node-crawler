package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

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
	router.HandleFunc("/v1/clients", a.handleClients)
	router.HandleFunc("/v1/clients/{name}", a.handleClient)

	http.ListenAndServe(":10000", router)
}

type client struct {
	Name  string
	Count int
}

// handles the clients endpoint
func (a *Api) handleClients(rw http.ResponseWriter, r *http.Request) {
	query := "SELECT name, COUNT(name) FROM nodes GROUP BY name"
	clients, err := clientQuery(a.db, query) //TODO handle err
	fmt.Println(clients)
	if err != nil {
		panic(err)
	}
	json.NewEncoder(rw).Encode(clients)
}

func (a *Api) handleClient(rw http.ResponseWriter, r *http.Request) {
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
		err = rows.Scan(&cl.Name, &cl.Count)
		if err != nil {
			return nil, err
		}
		clients = append(clients, cl)
	}
	return clients, nil
}
