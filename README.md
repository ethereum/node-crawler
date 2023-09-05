# Ethereum Node Crawler

Crawls the network and visualizes collected data. This repository includes backend, API and frontend for Ethereum network crawler.

[Backend](./crawler) is based on [devp2p](https://github.com/ethereum/go-ethereum/tree/master/cmd/devp2p) tool. It tries to connect to discovered nodes, fetches info about them and creates a database. [API](./api) software reads raw node database, filters it, caches and serves as API. [Frontend](./frontend) is a web application which reads data from the API and visualizes them as a dashboard.

Features:

- Advanced filtering, allows you to add filters for a customized dashboard
- Drilldown support, allows you to drill down the data to find interesting trends
- Network upgrade readiness overview
- Responsive mobile design

## Contribute

Project is still in an early stage, contribution and testing is welcomed. You can run manually each part of the software for development purposes or deploy whole production ready stack with Docker.

### Frontend

#### Development

For local development with debugging, remoting, etc:

1. Copy `.env` into `.env.local` and replace the variables.
1. And then `npm install` then `npm start`
1. Run tests to make sure the data processing is working good. `npm test`

#### Production

To deploy this web app:

1. Build the production bits by `npm install` then `npm run build` the contents will be located in `build` folder.
1. Use your favorite web server, in this example we will be using nginx.
1. The nginx config for that website could be which proxies the api to endpoint `/v1`.
   Review the `frontent/nginx.conf` file for an example.

### Backend API

The API is using 2 databases. 1 of them is the raw data from the crawler and the other one is the API database.
Data will be moved from the crawler DB to the API DB regularly by this binary.
Make sure to start the crawler before the API if you intend to run them together during development.

#### Dependencies

- golang
- sqlite3

#### Development

```
go run ./cmd/crawler
```

#### Production

1. Build the assembly into `/usr/bin`
   ```
   go build ./cmd/cralwer -o /usr/bin/node-crawler
   ```
1. Create a system user for running the application
   ```
   useradd --system --create-home --home-dir /var/lib/node-crawler node-crawler
   ```
1. Make sure database is in `/var/lib/node-crawler/crawler.db`
1. Create a systemd service in `/etc/systemd/system/node-crawler.service`:
   ```
   [Unit]
   Description = eth node crawler api
   Wants       = network-online.target
   After       = network-online.target

   [Service]
   User       = node-crawler
   ExecStart  = /usr/bin/node-crawler api --crawler-db /var/lib/node-crawler/crawler.db --api-db /var/lib/node-crawler/api.db
   Restart    = on-failure
   RestartSec = 3
   TimeoutSec = 300

   [Install]
   WantedBy = multi-user.target
   ```
1. Then enable it and start it.
   ```
   systemctl enable node-crawler
   systemctl start node-crawler
   systemctl status node-crawler
   ```

### Crawler

#### Dependencies

- golang
- sqlite3

##### Country location

- `GeoLite2-Country.mmdb` file from [https://dev.maxmind.com/geoip/geolite2-free-geolocation-data?lang=en](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data?lang=en)
  - you will have to create an account to get access to this file

#### Development

```
go run ./cmd/crawler
```

Run crawler using `crawl` command.

```
go run ./cmd/crawler crawl
```

#### Production

Build crawler and copy the binary to `/usr/bin`.

```
go build ./cmd/crawler -o /usr/bin/node-crawler
```

Create a systemd service similarly to above API example. In executed command, override default settings by pointing crawler database to chosen path and setting period to write crawled nodes.
If you want to get the country that a Node is in you have to specify the location the geoIP database as well.

##### No GeoIP

```
node-crawler crawl --timeout 10m --crawler-db /path/to/database
```

##### With GeoIP

```
node-crawler crawl --timeout 10m --crawler /path/to/database --geoipdb GeoLite2-Country.mmdb
```

### Docker setup

Production build of preconfigured software stack can be easily deployed with Docker. To achieve this, clone this repository and access `docker` directory.

Make sure you have [Docker](https://github.com/docker/docker-ce/releases) and [docker-compose](https://github.com/docker/compose/releases) tools installed.

The docker compose uses a local `./data` directory to store the database and GeoIP file.
It's best to create this directory and add the GeoIP file before starting the system.
You can read the `./docker-compose.yml` file for more details.

```
docker-compose up
```
