const cron = require('node-cron');
const fetch = require('node-fetch');

let clients;

async function cacheApiCall() {
  const response = await fetch('https://crawler.tmio.io/rest/clients');
  clients = await response.json()
}

cacheApiCall()

cron.schedule('* * * * *', async () => {
  await cacheApiCall() 
});

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