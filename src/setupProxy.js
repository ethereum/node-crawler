const fetch = require('node-fetch');
const fs = require('fs');

let clients;

async function writeCache(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile('./clients.json', data, 'utf8', (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function cacheCall() {
  return new Promise((resolve, reject) => {

    fs.readFile('./clients.json', 'utf-8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(data))
      }
    })
  })
}

async function apiCall() {
  
  try {
    const response = await fetch(process.env.CRAWLER_API_URL);
    clients = await response.json()
    if (clients && clients.length) {
      await writeCache(clients)
      return clients
    } else {
      console.error('Clients was empty, read from cache');
      return cacheCall()
    }
  } catch (e) {
    console.error('Tuweni API is down, read from cache');
    return cacheCall()
  }
}

async function fetchClients() {
  if (clients && clients.length) {
    return clients
  }

  return apiCall()
}

module.exports = async (app) => {
  app.get('/rest/clients', async (req, res) => res.json(await fetchClients()))
};
