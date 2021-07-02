# Api Specifications
Showcases what the API for querying should be.

### MVP: Raw Output (for debug and dev)

This is a debug endpoint that has the raw `clientId` details.

<table>
  <tr>
    <th>Method</th>
    <td>GET</td>
  </tr>
  <tr>
    <th>Endpoint</th>
    <td>/api/v1/debug/clients</td>
  </tr>
  <tr>
    <th>Response</th>
    <td>
      <pre>
[
  { clientId: "Geth/goerli/v1.10.4-unstable-966ee3ae-20210528/linux-amd64/go1.16.4", count: 12 }, 
  { clientId: "Geth/v1.10.4-stable/linux-x86_64/go1.16.4", count: 1 }
]
      </pre></td>
  </tr>
</table>

### MVP: Parsed Output

Retreives the list of clients sturctured and strongly typed. Ordered by count.

<table>
  <tr>
    <th>Method</th>
    <td>GET</td>
  </tr>
  <tr>
    <th>Endpoint</th>
    <td>/api/v1/clients</td>
  </tr>
  <tr>
    <th>Response</th>
    <td>
      <pre>
[
  {
    count: 12,
    client: {
      name: 'Geth',
      label: 'goerli',
      version: { 
        major: 1,
        minor: 10,
        patch: 4,
        tag: 'unstable',
        build: '966ee3ae',
        date: '20210528',
      },
      os: {
        vendor: 'linux',
        architecture: 'amd64'
      },
      runtime: {
        name: 'go',
        version: { 
          major: 1,
          minor: 16,
          patch: 4
        }
      }
    },
  },
  {
    count: 1,
    client: {
      name: 'Geth',
      version: { 
        major: 1,
        minor: 10,
        patch: 4,
        tag: 'stable',
      },
      os: {
        vendor: 'linux',
        architecture: 'x86_64'
      },
      runtime: {
        name: 'go',
        version: { 
          major: 1,
          minor: 16,
          patch: 4
        }
      }
    }
  }
]
      </pre>
    </td>
  </tr>
</table>

### Stretch: Filtered Clients

Gets the list of clients filtered. Ordered by count. You can add more than one filter.

<table>
  <tr>
    <th>Method</th>
    <td>GET</td>
  </tr>
  <tr>
    <th>Query Params</th>
    <td>
      <table>
        <tr>
          <th>Param</th>
          <th>Type</th>
          <th>Required</th>
        </tr>
        <tr>
          <td>filter</td>
          <td>Filter</td>
          <td>true</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <th>Endpoint</th>
    <td>/api/v1/clients?filter=<strong>TBD</strong
></td>
  </tr>
  <tr>
    <th>Response</th>
    <td>
      <pre>
[
  { name: "Geth", count: 1000  }, 
  { name: "Nethermind", count: 12 }, 
]
      </pre></td>
  </tr>
</table>

### Stretch: Client Details

Get the details of a specific client

<table>
  <tr>
    <th>Method</th>
    <td>GET</td>
  </tr>
  <tr>
    <th>Endpoint</th>
    <td>/api/v1/clients/<strong>geth</strong></td>
  </tr>
  <tr>
    <th>Response</th>
    <td>
      <pre>
{
  nodeCount: 3389,
  versions: [
     {
       version: "1.10.3",
       count: 1256
     }
  },
  syncStatus: {
      synced: 3488,
      syncing: 707
  },
  os: [
      {
        name: "Linux",
        count: 3868,
        architecture: [
          {
            name: "x86_64",
            count: 1200
           }
        ]
      },
      {
        name: "Darwin",
        count: 43,
        architecture: [
          {
            name: "amd64",
            count: 40
           }
        ]
      }
  ],
  runtime: [
      {
        name: "go",
        version: 1.14,
        count: 10
      },
      {
        name: "go",
        version: 1.15,
        count: 5
      }
  ]
}
      </pre></td>
  </tr>
</table>


### Stretch: Historical Data

Get the list of historical entry points given a specific filter. Note filter version is optional so we can send `filter=geth` for all versions or `filter=geth:1.10.2` for all version that includes that or greater!

<table>
  <tr>
    <th>Method</th>
    <td>GET</td>
  </tr>
  <tr>
    <th>Query Params</th>
    <td>
      <table>
        <tr>
          <th>Param</th>
          <th>Type</th>
          <th>Required</th>
        </tr>
        <tr>
          <td>since</td>
          <td>[month|day|year|all]</td>
          <td>false (default=month)</td>
        </tr>
        <tr>
          <td>filter</td>
          <td>Filter</td>
          <td>true</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <th>Endpoint</th>
    <td>/api/v1/historical?since=month&filter=<strong>TBD</strong
></td>
  </tr>
  <tr>
    <th>Response</th>
    <td>
      <pre>
[
  { date: "06-26-2021", geth: 4000, nethermind: 1000 }, 
  { date: "06-25-2021", geth: 4100, nethermind: 900 }, 
  { date: "06-24-2021", geth: 4200, nethermind: 800 }, 
]
      </pre></td>
  </tr>
</table>


## Filter Schema design

Filter allows `AND` and `OR` querying with a operator based baked into each field.

For example and `AND`, find me Geth versioned more than 1.2.45. :

```
[
  [
    ["name:geth"],["version:1.2.45:gt"]
  ]
]
```

Another example an `OR`, filter by geth or netherermind:

```
[
  [
    ["name:geth"],["version:1.2.45:gt"]
  ],
  [
    ["name:nethermind"],["version:0.2.45:gt"]
  ]
]