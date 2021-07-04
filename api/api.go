package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"strings"

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
	router.HandleFunc("/v1/filter", a.handleFilter).Queries("select", "{select}", "filter", "{filter}", "groupBy", "{groupBy}")
	router.HandleFunc("/v1/filter", a.handleFilter).Queries("filter", "{filter}", "groupBy", "{groupBy}")
	router.HandleFunc("/v1/filter", a.handleFilter).Queries("filter", "{filter}")
	router.HandleFunc("/v1/filter", a.handleFilter)
	router.HandleFunc("/v1/dashboard", a.handleDashboard).Queries("filter", "{filter}")
	router.HandleFunc("/v1/dashboard", a.handleDashboard)

	http.ListenAndServe(":10000", router)
}

type client struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type node struct {
	ID string
	parser.ParsedInfo
}

func (a *Api) handleFilter(rw http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fields, err := addSelectArgs(vars)
	if err != nil {
		fmt.Println(err)
		return
	}
	// Where
	where, whereArgs, err := addFilterArgs(vars)
	if err != nil {
		fmt.Println(err)
		return
	}
	// GroupBy
	groupBy := vars["groupBy"]
	var group string
	if len(groupBy) > 0 {
		group, err = addGroupByArgs(groupBy)
		if err != nil {
			fmt.Println(err)
			return
		}
	}

	// Construct query
	query := fmt.Sprintf("SELECT %v FROM nodes WHERE %v %v", fields, where, group)
	fmt.Println(query)
	nodes, err := argQuery(a.db, query, whereArgs)
	if err != nil {
		fmt.Println(err)
	}
	json.NewEncoder(rw).Encode(nodes)
}

func addSelectArgs(vars map[string]string) (string, error) {
	sel := vars["select"]
	if len(sel) == 0 {
		return "*", nil
	}
	var selArgs []string
	err := json.Unmarshal([]byte(sel), &selArgs)
	if err != nil {
		return "", err
	}
	var sele string
	for i, arg := range selArgs {
		if !validateKey(arg) {
			return "", fmt.Errorf("invalid arg: %v", arg)
		}
		sele += arg
		if i < len(selArgs)-1 {
			sele += ", "
		}
	}
	return sele, nil
}

func addFilterArgs(vars map[string]string) (string, []interface{}, error) {
	filter := strings.TrimSpace(vars["filter"])
	if  filter == "" {
		return "", nil, nil
	}

	query := "FALSE "
	var filterArgs [][]string
	err := json.Unmarshal([]byte(filter), &filterArgs)
	if err != nil {
		return "", nil, err
	}

	var args []interface{}
	for _, outer := range filterArgs {
		inner := ""
		for idx, arg := range outer {
			key, value, comp, err := unmarshalFilterArgs(arg)
			if err != nil {
				return "", nil, err
			}
			if validateKey(key) {
				inner += fmt.Sprintf("(%v %v ?) ", key, comp)
				args = append(args, value)
			}
			if idx < len(outer)-1 {
				inner += " AND "
			}
		}
		if len(inner) > 0 {
			query += fmt.Sprintf("OR (%v) ", inner)
		}
	}
	return query, args, nil
}

// filter args are marshalled as key:value or key:value:comp
// with comp being a comparator (eq, gt, lt, gte, lte, not)
func unmarshalFilterArgs(arg string) (string, string, string, error) {
	split := strings.Split(arg, ":")
	if len(split) == 3 {
		comp := "="
		switch split[2] {
		case "eq":
			comp = "="
		case "lt":
			comp = "<"
		case "lte":
			comp = "<="
		case "gt":
			comp = ">"
		case "gte":
			comp = ">="
		case "not":
			comp = "!="
		default:
		}
		return split[0], split[1], comp, nil
	} else if len(split) == 2 {
		return split[0], split[1], "=", nil
	}
	return "", "", "", fmt.Errorf("umarshalling failed, got %v want 2 or 3 args", len(split))
}

func addGroupByArgs(groupBy string) (string, error) {
	var groupArgs []string
	err := json.Unmarshal([]byte(groupBy), &groupArgs)
	if err != nil {
		return "", err
	}
	group := " GROUP BY "
	for i, arg := range groupArgs {
		if !validateKey(arg) {
			return "", fmt.Errorf("invalid arg: %v", arg)
		}
		group += arg
		if i < len(groupArgs)-1 {
			group += ", "
		}
	}
	return group, nil
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
	nodes, err := argQuery(a.db, query, []interface{}{key})
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
	qu1, args1 := createLondonQuery()
	query += "AND" + qu1
	allArgs := []interface{}{key}
	allArgs = append(allArgs, args1...)
	nodes, err := argQuery(a.db, query, allArgs)
	if err != nil {
		fmt.Println(err)
	}
	json.NewEncoder(rw).Encode(nodes)
}

func (a *Api) handleDashboard(rw http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	// Where
	where, whereArgs, err := addFilterArgs(vars)
	if err != nil {
		fmt.Println(err)
		return
	}
	
	if whereArgs != nil {
		where = "WHERE " + where
	}

	topClientsQuery := fmt.Sprintf("SELECT name as Name, COUNT(name) as Count FROM nodes %v GROUP BY name ORDER BY count DESC", where)
	topLanguageQuery := fmt.Sprintf("SELECT language as Name, COUNT(language) as Count FROM nodes %v GROUP BY language ORDER BY count DESC", where)
	topOsQuery := fmt.Sprintf("SELECT os as Name, COUNT(os) as Count FROM nodes %v GROUP BY os ORDER BY count DESC", where)
	topVersionQuery := fmt.Sprintf("SELECT major || '.' || minor || '.' || patch as Name, count(Name) as Count FROM nodes %v GROUP BY Name ORDER BY Count DESC", where)

	clients, err := clientQuery(a.db, topClientsQuery, whereArgs...)
	if err != nil {
		fmt.Println(err)
	}

	language, err := clientQuery(a.db, topLanguageQuery, whereArgs...)
	if err != nil {
		fmt.Println(err)
	}

	operatingSystems, err := clientQuery(a.db, topOsQuery, whereArgs...)
	if err != nil {
		fmt.Println(err)
	}

	// When the filter has a name, we don't want to include that in the json response.
	var versions []client
	if strings.Contains(vars["filter"], "[\"name:") {
		dataVersions, err := clientQuery(a.db, topVersionQuery, whereArgs...)
		versions = dataVersions
		if err != nil {
			fmt.Println(err)
		}
	}

	type result struct {
		Clients			[]client `json:"clients"`
		Languages		[]client `json:"languages"`
		OperatingSystems[]client `json:"operatingSystems"`
		Versions		[]client `json:"versions"`
	}

	json.NewEncoder(rw).Encode(result{Clients: clients, Languages: language, OperatingSystems: operatingSystems, Versions: versions})
}

func (a *Api) handleLondonCount(rw http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	key := vars["name"]
	query := "SELECT name, COUNT(name) FROM nodes WHERE true "
	if key != "" {
		query = "SELECT name, COUNT(name) FROM nodes WHERE name = ? "
	}
	qu1, args1 := createLondonQuery()
	query += "AND" + qu1
	query += "GROUP BY name"
	// ready
	allArgs := []interface{}{key}
	allArgs = append(allArgs, args1...)
	clients, err := clientQuery(a.db, query, allArgs...) //TODO handle err
	if err != nil {
		fmt.Println(err)
	}
	// not ready
	query = "SELECT name, COUNT(name) FROM nodes WHERE true "
	if key != "" {
		query = "SELECT name, COUNT(name) FROM nodes WHERE name = ? "
	}
	qu2, args2 := createLondonQuery()
	query += "AND NOT" + qu2
	query += "GROUP BY name"
	allArgs = append(allArgs, args2...)
	clients2, err := clientQuery(a.db, query, allArgs...) //TODO handle err
	if err != nil {
		fmt.Println(err)
	}
	type result struct {
		Ready    []client `json:"ready"`
		NotReady []client `json:"notready"`
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

func argQuery(db *sql.DB, query string, args []interface{}) ([]map[string]interface{}, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	var results []map[string]interface{}
	for rows.Next() {
		columns, err := rows.ColumnTypes()
		if err != nil {
			return nil, err
		}

		values := make([]interface{}, len(columns))
		object := map[string]interface{}{}
		for i, column := range columns {
			object[column.Name()] = reflect.New(column.ScanType()).Interface()
			values[i] = object[column.Name()]
		}
		err = rows.Scan(values...)
		if err != nil {
			return nil, err
		}
		results = append(results, object)
	}
	return results, nil
}

func createLondonQuery() (string, []interface{}) {
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
	var values []interface{}
	for i, cl := range clients {
		// TODO: this still has an SQL injection, but without it, the query returns no results
		name := fmt.Sprintf("name == \"%v\"", cl.name)
		//name := "name = ?"
		//values = append(values, cl.name)
		major := "major > ?"
		values = append(values, cl.major)
		minor := "major == ? AND minor > ?"
		values = append(values, cl.major)
		values = append(values, cl.minor)
		patch := "major == ? AND minor == ? AND patch >= ?"
		values = append(values, cl.major)
		values = append(values, cl.minor)
		values = append(values, cl.patch)
		inner := fmt.Sprintf("(%v) OR (%v) OR (%v)", major, minor, patch)
		query += fmt.Sprintf("( %v AND (%v))", name, inner)
		if i < len(clients)-1 {
			query += " OR "
		}
	}
	query += ")"
	return query, values
}

func validateKey(key string) bool {
	validKeys := map[string]struct{}{
		"id":           {},
		"name":         {},
		"major":        {},
		"minor":        {},
		"patch":        {},
		"tag":          {},
		"build":        {},
		"date":         {},
		"os":           {},
		"architecture": {},
		"language":     {},
	}
	_, ok := validKeys[key]
	return ok
}
