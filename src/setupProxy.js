const fetch = require('node-fetch');

let clients;

async function cacheApiCall() {
  const response = await fetch(process.env.CRAWLER_API_URL);
  clients = await response.json()
}

cacheApiCall()

module.exports = function(app) {
  app.get('/rest/clients', (req, res) => {
    if (!clients) {
      return res.json({
        status: 'loading'
      })
    }
    return res.json(clients)
  }
)};