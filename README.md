# Ethereum Node Stats

Will showcase which nodes are ready for London Fork, will be customizable to an fork.
https://blog.ethereum.org/2021/06/18/london-testnets-announcement/

Uses Apache Tuweni https://tuweni.apache.org/ to fetch all the data, then in the client it will massage the data to a format understandable then render them in charts.

## Development

Copy `.env` into `.env.local` and replace the variables. And then `npm install` then `npm start`

Run tests to make sure the data processing is working good. `npm test`

## London Fork

```
Geth: '1.10.4',
Nethermind: '1.10.73',
turbogeth: '2021.06.04-alpha',
besu: '21.7.0-RC1',
OpenEthereum: '3.3.0-rc2',
ethereumjs: '5.4.1'
```
