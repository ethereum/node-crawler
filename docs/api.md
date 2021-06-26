# Api Specifications
Showcases what the API for querying should be.

### Raw Output (for debug and dev)

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

### Parsed Output

Retreives the list of clients sturctured and strongly typed.

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

### Filtered Clients

Gets the list of clients filtered

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
          <td>[name]:[version],[name2]:[version2],[etcName]:[etcVersion]</td>
          <td>true</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <th>Endpoint</th>
    <td>/api/v1/debug/clients?filter="geth:1.10.4,nethermind:1.10.73,turbogeth:2021.06.04-alpha,besu:21.7.0-RC1,openethereum:3.3.0-rc2,ethereumjs:5.4.1"</td>
  </tr>
  <tr>
    <th>Response</th>
    <td>
      <pre>
[
  { name: "Geth", ready: 1000, not_ready: 121 }, 
  { name: "Nethermind", ready: 100, not_ready: 12 }, 
]
      </pre></td>
  </tr>
</table>


### Historical Client Trends

Gets the historical node count for each. Note that the `range` if given a `month` a result of last 30 days of items . When it is in `day`, it repivots into 24 items one for each hour, same goes for year (12 items pivoted). We might increase the precision with introducing another future parameter.

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
          <td>range</td>
          <td>month|day|year|all</td>
          <td>false (month)</td>
        </tr>
        <tr>
          <td>filter</td>
          <td>[name]:[version],[name2]:[version2],[etcName]:[etcVersion]</td>
          <td>true</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <th>Endpoint</th>
    <td>/api/v1/debug/clients/historical?range=month&filter="geth:1.10.4,nethermind:1.10.73"</td>
  </tr>
  <tr>
    <th>Response</th>
    <td>
      <pre>
[
  {
    date: "06/25/2021",
    geth: 4000,
    nethermind: 1000,
  },
  {
    date: "06/24/2021",
    geth: 3900,
    nethermind: 1100,
  }
]
      </pre></td>
  </tr>
</table>
