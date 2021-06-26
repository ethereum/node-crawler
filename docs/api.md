# Api Specifications


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
