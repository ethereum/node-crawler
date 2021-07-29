# Ethereum Node Crawler

This repository includes frontend and API for Ethereum network crawler. Crawler used for discovering peers is part of `devp2p` tool from [go-ethereum](https://github.com/ethereum/go-ethereum) and is currently not included in this repository. 

API software reads raw database of nodes data crawled from the network, filters it, caches and serves as API. Frontend is a web interface which reads data from the API and visualizes them as a dashboard. 

Features:
- Advanced filtering, allows you to add filters for a customized dashboard
- Drilldown support, allows you to drill down the data to find interesting trends
- Network upgrade readiness overview, currently supports predefined filters for London upgrade
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
1. The nginx config for that website could be which proxies the api to endpoint `/v1`:
  ```
  server {
        server_name crawler.com;
        root /var/www/crawler.com;
        index index.html;

        location /v1 {
                proxy_pass http://localhost:10000;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
        }

        location / {
                try_files $uri $uri/ /index.html;
        }

        listen 80;
        listen [::]:80;
  }
  ```

### Backend API

Download latest golang.

#### Development
```
go run ./ .
```

#### Production

1. Build the assembly into `/usr/bin`
  ```
  go build ./ . -o /usr/bin/node-crawler-backend
  ```
1. Move the database into `/etc/node-crawler-backend/nodetable`
1. Create a systemd service in `/etc/systemd/system/node-crawler-backend.service`:
   ```
   [Unit]
   Description     = eth node crawler
   Wants           = network-online.target
   After           = network-online.target

   [Service]
   User            = node-crawler
   ExecStart       = /usr/bin/node-crawler-backend --crawler-db-path /etc/node-crawler-backend/nodetable --api-db-path /etc/node-crawler-backend/nodes
   Restart         = on-failure
   RestartSec      = 3
   TimeoutSec      = 300

   [Install]
   WantedBy    = multi-user.target
   ```
1. Then enable it and start it.
   ```
   systemctl enable node-crawler-backend
   systemctl start node-crawler-backend
   systemctl status node-crawler-backend
   ```

### Docker setup

Production build of preconfigured software stack can be easily deployed with Docker. To achieve this, clone this repository and access `docker` directory. 

```
cd docker
```
Make sure you have Docker and Compose tool installed. 
```
docker-compose up
```


### Crawler
TBD

