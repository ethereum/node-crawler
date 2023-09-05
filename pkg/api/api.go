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
	// Drop the cache every 2 minutes
	ticker := time.NewTicker(2 * time.Minute)
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
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("Hello")) })
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
	Countries        []client `json:"countries"`
}

func (a *Api) cachedOrQuery(prefix, query string, whereArgs []interface{}) []client {
	var result []client
	if cl, ok := a.cache.Get(prefix + toQuery(query, whereArgs)); ok {
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

func toQuery(query string, whereArgs []interface{}) string {
	var res string
	queryParts := strings.Split(query, "?")
	for idx, s := range queryParts {
		res += s
		if idx == len(whereArgs) {
			break
		}
		res += whereArgs[idx].(string)
	}
	return res
}

func (a *Api) storeCache(
	clientQuery,
	languageQuery,
	osQuery,
	countryQuery,
	versionQuery string,
	whereArgs []interface{},
	r result,
) {
	a.cache.Add("c"+toQuery(clientQuery, whereArgs), r.Clients)
	a.cache.Add("l"+toQuery(languageQuery, whereArgs), r.Languages)
	a.cache.Add("o"+toQuery(osQuery, whereArgs), r.OperatingSystems)
	a.cache.Add("v"+toQuery(versionQuery, whereArgs), r.Versions)
	a.cache.Add("co"+toQuery(versionQuery, whereArgs), r.Countries)
}

func (a *Api) handleDashboard(rw http.ResponseWriter, r *http.Request) {
	// Set's the cache to 10 minutes, which matches the same as the crawler.
	rw.Header().Set("Cache-Control", "max-age=600")

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
		topLanguageQuery = fmt.Sprintf(`
			SELECT
				Name,
				Count(*) as Count
			FROM (
				SELECT
					language_name || language_version as Name
				FROM nodes %v
			)
			GROUP BY Name
			ORDER BY Count DESC
		`, where)
	} else {
		topLanguageQuery = fmt.Sprintf(`
			SELECT
				language_name as Name,
				COUNT(language_name) as Count
			FROM nodes %v
			GROUP BY language_name
			ORDER BY Count DESC
		`, where)
	}

	topClientsQuery := fmt.Sprintf(`
		SELECT
			name as Name,
			COUNT(name) as Count
		FROM nodes %v
		GROUP BY name
		ORDER BY count DESC
	`, where)
	topOsQuery := fmt.Sprintf(`
		SELECT
			os_name as Name,
			COUNT(os_name) as Count
		FROM nodes %v
		GROUP BY os_name
		ORDER BY count DESC
	`, where)
	topVersionQuery := fmt.Sprintf(`
		SELECT
			Name,
			Count(*) as Count
		FROM (
			SELECT
				version_major || '.' || version_minor || '.' || version_patch as Name
			FROM nodes %v
		)
		GROUP BY Name
		ORDER BY Count DESC
	`, where)
	topCountriesQuery := fmt.Sprintf(`
		SELECT
			country_name as Name,
			COUNT(country_name) as Count
		FROM nodes %v
		GROUP BY country_name
		ORDER BY count DESC
	`, where)

	clients := a.cachedOrQuery("c", topClientsQuery, whereArgs)
	language := a.cachedOrQuery("l", topLanguageQuery, whereArgs)
	operatingSystems := a.cachedOrQuery("o", topOsQuery, whereArgs)
	countries := a.cachedOrQuery("co", topCountriesQuery, whereArgs)

	var versions []client
	if nameCountInQuery == 1 {
		versions = a.cachedOrQuery("v", topVersionQuery, whereArgs)
	}

	res := result{
		Clients:          clients,
		Languages:        language,
		OperatingSystems: operatingSystems,
		Versions:         versions,
		Countries:        countries,
	}
	a.storeCache(
		topClientsQuery,
		topLanguageQuery,
		topOsQuery,
		topCountriesQuery,
		topVersionQuery,
		whereArgs,
		res,
	)
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
		"country":          {},
	}
	_, ok := validKeys[key]
	return ok
}
