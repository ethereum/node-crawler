package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/mux"
	lru "github.com/hashicorp/golang-lru"
)

type Api struct {
	db    *sql.DB
	cache *lru.Cache
}

func New(sdb *sql.DB) *Api {
	cache, err := lru.New(256)
	if err != nil {
		return nil
	}
	api := &Api{db: sdb, cache: cache}
	go api.dropCacheLoop()
	return api
}

func (a *Api) dropCacheLoop() {
	ticker := time.NewTicker(2 * time.Minute)
	// Drop the cache every 2 minutes
	for range ticker.C {
		fmt.Println("Dropping Cache")
		c, err := lru.New(256)
		if err != nil {
			panic(err)
		}
		a.cache = c
	}
}

func (a *Api) HandleRequests(wg *sync.WaitGroup) {
	defer wg.Done()
	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/", func(rw http.ResponseWriter, r *http.Request) { rw.Write([]byte("Hello")) })
	router.HandleFunc("/v1/dashboard", a.handleDashboard).Queries("filter", "{filter}")
	router.HandleFunc("/v1/dashboard", a.handleDashboard)
	fmt.Println("Start serving on port 10000")
	http.ListenAndServe(":10000", router)
}

type client struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

func addFilterArgs(vars map[string]string) (string, []interface{}, error) {
	filter := strings.TrimSpace(vars["filter"])
	if filter == "" {
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

type result struct {
	Clients          []client `json:"clients"`
	Languages        []client `json:"languages"`
	OperatingSystems []client `json:"operatingSystems"`
	Versions         []client `json:"versions"`
}

func (a *Api) cachedOrQuery(query string, whereArgs []interface{}) []client {
	var result []client
	if cl, ok := a.cache.Get(query); ok {
		result = cl.([]client)
	} else {
		var err error
		result, err = clientQuery(a.db, query, whereArgs...)
		if err != nil {
			fmt.Println(err)
		}
	}
	return result
}

func (a *Api) handleDashboard(rw http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	nameCountInQuery := strings.Count(vars["filter"], "\"name:")

	// Where
	where, whereArgs, err := addFilterArgs(vars)
	if err != nil {
		fmt.Println(err)
		return
	}

	if whereArgs != nil {
		where = "WHERE " + where
	}

	var topLanguageQuery string
	if nameCountInQuery == 1 {
		topLanguageQuery = fmt.Sprintf("SELECT Name, Count(*) as Count FROM (SELECT language_name || language_version as Name FROM nodes %v) GROUP BY Name ORDER BY Count DESC", where)
	} else {
		topLanguageQuery = fmt.Sprintf("SELECT language_name as Name, COUNT(language_name) as Count FROM nodes %v GROUP BY language_name ORDER BY Count DESC", where)
	}

	topClientsQuery := fmt.Sprintf("SELECT name as Name, COUNT(name) as Count FROM nodes %v GROUP BY name ORDER BY count DESC", where)
	topOsQuery := fmt.Sprintf("SELECT os_name as Name, COUNT(os_name) as Count FROM nodes %v GROUP BY os_name ORDER BY count DESC", where)
	topVersionQuery := fmt.Sprintf("SELECT Name, Count(*) as Count FROM (SELECT version_major || '.' || version_minor || '.' || version_patch as Name FROM nodes %v) GROUP BY Name ORDER BY Count DESC ", where)

	clients := a.cachedOrQuery(topClientsQuery, whereArgs)
	language := a.cachedOrQuery(topLanguageQuery, whereArgs)
	operatingSystems := a.cachedOrQuery(topOsQuery, whereArgs)
	var versions []client
	if nameCountInQuery == 1 {
		versions = a.cachedOrQuery(topVersionQuery, whereArgs)
	}

	res := result{Clients: clients, Languages: language, OperatingSystems: operatingSystems, Versions: versions}
	a.cache.Add(topClientsQuery, clients)
	a.cache.Add(topLanguageQuery, language)
	a.cache.Add(topOsQuery, operatingSystems)
	a.cache.Add(topVersionQuery, versions)
	json.NewEncoder(rw).Encode(res)
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

func validateKey(key string) bool {
	validKeys := map[string]struct{}{
		"id":               {},
		"name":             {},
		"version_major":    {},
		"version_minor":    {},
		"version_patch":    {},
		"version_tag":      {},
		"version_build":    {},
		"version_date":     {},
		"os_name":          {},
		"os_architecture":  {},
		"language_name":    {},
		"language_version": {},
	}
	_, ok := validKeys[key]
	return ok
}
