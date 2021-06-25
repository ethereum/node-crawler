import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';


const ClientParser = {
  'geth': '1.10.4',
  'nethermind': '1.10.73',
  'turbogeth': '2021.06.04-alpha',
  'besu': '21.7.0-RC1',
  'openethereum': '3.3.0-rc2',
  'ethereumjs': '5.4.1'
}

interface Runtime {
  name: string
  version?: string
}

interface ClientDetail {
  label?: string
  version?: string
  os: string
  runtime?: Runtime
}

interface Client extends ClientDetail {
  id: string
}

function parseVersion(version: string) {
  console.log(version)
    return version
}

function parseOs(os: string) {
  return os
}

const errors: any = {
  runtime: [],
  parse: [],
  clientid: []
}

const runtimeIndex: any = {}

function cache(index: any, name: string, version: string) {
  if (name in index) {
    if (version in index[name]) {
      index[name][version]++
    } else {
      index[name][version] = 1
    }
  } else {
    index[name] = {[version]: 1}
  }
}

function parseRuntime(runtime: string): Runtime | undefined {
  let matches = runtime.match(/([a-zA-Z]+)([\d+.?]+)/)
  if (matches) {
    const [, name, version] = matches

    cache(runtimeIndex, name, version)

    return {
      name,
      version
    }
  }
  
  matches = runtime.match(/java-(\d+)/)
  if (matches) {
    cache(runtimeIndex, 'java', matches[1])
    return {
      name: 'java',
      version: matches[1]
    }
  }

  errors.runtime.push(runtime)
  return undefined
}


function parseRest(rest: string): ClientDetail | undefined {
  let matches = rest.match(/(.+)\/(.+)\/(.+)\/(.+)/)
  if (matches) {
    return {
      label: matches[1],
      version: parseVersion(matches[2]),
      os: parseOs(matches[3]),
      runtime: parseRuntime(matches[4]),
    }
  }
  
  matches = rest.match(/(.+)\/(.+)\/(.+)/)
  if (matches) {
    return {
      version: parseVersion(matches[1]),
      os: parseOs(matches[2]),
      runtime: parseRuntime(matches[3]),
    }
  }

  matches = rest.match(/(.+)\/(.+)/)
  if (matches) {
    return {
      os: parseOs(matches[1]),
      runtime: parseRuntime(matches[2]),
    }
  }

  errors.parse.append(rest)
  return undefined
}

function parseClientId(clientId: string): Client | undefined {
  const matches = clientId.match(/(\w+)\/(.+)/)
  if (matches) {
    const rest = parseRest(matches[2])
    if (!rest) {
        return undefined
    }

    return {
      id: matches[1],
      ...rest
    }
  }

  errors.clientid.append(clientId)
  return undefined
}

interface ClientBucket {
  count: number,
  rest: Client
}


interface ClientArrayItem {
  id: string
  count: number,
  bucket: ClientBucket[]
}

interface ClientApiResponse {
  clientId: string
  count: number
}

function App() {
  const [data, setData] = useState()
  const [loading, setLoading] = useState<string>('loading data')

  useEffect(() => {
    const run = async () => {
      const response = await fetch('/rest/clients');
      const clients : ClientApiResponse[] = await response.json()
      setLoading('preparing data')

      const clientBuckets = new Map<string, ClientBucket[]>()
      for (let c in clients) {
        const { clientId, count } = clients[c]
        const client = parseClientId(clientId)

        if (!client) {
          continue
        }

        if (clientBuckets.has(client.id)) {
          clientBuckets.get(client.id)?.push({ count, rest: client })
        } else {
          clientBuckets.set(client.id, [ { count, rest: client } ])
        }
      }

      setLoading('rendering data')
      console.log(clientBuckets.keys())

      const bucketList: ClientArrayItem[] = []

      for (const [id, value] of clientBuckets.entries()) {
        const totalClients = value.reduce((prev, current) => {return prev + current.count}, 0)
        bucketList.push({
          count: totalClients,
          id,
          bucket: value
        })
      }

      bucketList.sort((a, b) => {
        return b.count - a.count
      })

      console.log('client buckets', bucketList)
      console.log('runtimes', runtimeIndex)
    }

    run()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {loading}
      </header>
    </div>
  );
}

export default App;
