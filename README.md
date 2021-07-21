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
Copy `.env` into `.env.local` and replace the variables. And then `npm install` then `npm start`

Run tests to make sure the data processing is working good. `npm test`

### Backend
```
cd api
go build ./ .
```

### Crawler
TBD
