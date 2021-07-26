# Ethereum Node Crawler

Crawls the network for Ethereum nodes and creates a dashboard that lets you visualize them.

Features:
- Advanced filtering, allows you to add filters for a customized dashboard
- Drilldown support, allows you to drill down the data to find interesting trends
- Fork view, currently supports predefined filters for London fork
- Works in mobile

## Contribute

This is an early project to make a rich dashboard for ethereum nodes.

### Frontend 
#### Development
For local development with debugging, remoting, etc:
- Copy `.env` into `.env.local` and replace the variables. 
- And then `npm install` then `npm start`
- Run tests to make sure the data processing is working good. `npm test`

#### Production
To deploy this web app:
- Build the production bits by `npm install` then `npm run build` the contents will be located in `build` folder. 
- Use your favorite web server, in this example we will be using nginx.
- The nginx config for that website could be which proxies the api to endpoint `/v1`:
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

To build the API, download latest golang and run:
```
cd api
go build ./ .
```

To deploy this on the machine, it is good to create a systemd daemon in `/etc/systemd/system/node-crawler-backend.service`:
 
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
Then enable it and start it.
```
systemctl enable node-crawler-backend
systemctl start node-crawler-backend
systemctl status node-crawler-backend
```

### Crawler
TBD

