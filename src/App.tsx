import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Legend, Cell, Tooltip, ResponsiveContainer, Sector,
  Label, LabelList, Bar, BarChart, XAxis, YAxis } from 'recharts';

import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

import './App.css';


const colors = scaleOrdinal(schemeCategory10).range();

const ClientParser = {
  'Geth': '1.10.4',
  'Nethermind': '1.10.73',
  'turbogeth': '2021.06.04-alpha',
  'besu': '21.7.0-RC1',
  'OpenEthereum': '3.3.0-rc2',
  'ethereumjs': '5.4.1'
}

interface Runtime {
  name: string
  version: string
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

    return {
      name,
      version
    }
  }
  
  matches = runtime.match(/java-(\d+)/)
  if (matches) {
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
  name: string
  count: number,
  bucket: ClientBucket[]
}

interface ClientApiResponse {
  clientId: string
  count: number
}

interface LoadingResponse {
  status: 'loading'
}

function App() {
  const [loading, setLoading] = useState<string>('loading data')
  const [runtimes, setRuntimes] = useState([])
  const [clients, setClients] = useState<any>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const run = async () => {

      
      const runtimeIndex: any = {}
      const nameIndex: any = {}

      const response = await fetch('/rest/clients');
      const jsonResponse : ClientApiResponse[] | LoadingResponse = await response.json()
      if ((jsonResponse as LoadingResponse).status === 'loading') {
        setLoading('still loading data')
        return;
      }
      setLoading('preparing data')

      const clients = jsonResponse as ClientApiResponse[]
      const clientBuckets = new Map<string, ClientBucket[]>()
      for (let c in clients) {
        const { clientId, count } = clients[c]
        const client = parseClientId(clientId)

        if (!client) {
          continue
        }
        
        if (client.runtime) {
          for (let a = 0; a < count; a++)
            cache(runtimeIndex, client.runtime.name, client.runtime.version)
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
          name: id,
          bucket: value
        })
      }

      bucketList.sort((a, b) => {
        return b.count - a.count
      })

      console.log('client buckets', bucketList)
      console.log('runtimes', runtimeIndex)
      const runtimeData: any = Object.keys(runtimeIndex).map(key => {
        const runtime  = runtimeIndex[key]
        const versions = Object.keys(runtime)
        return {
          name: key,
          value: versions.reduce((cur, prev) => cur + runtime[prev], 0)
        }
      })
      console.log(runtimeData)
      setRuntimes(runtimeData)

      setClients(bucketList)
    }

    run()
  }, [])

  
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{payload.name}</text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
        {`${payload.value}`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`${(percent * 100).toFixed(2)}%`}
      </text>
    </g>
  );
};

const onPieEnter = (data: any, index: number, e: React.MouseEvent) => {
  setActiveIndex(index)
};

const renderLabelContent: React.FunctionComponent = (props: any) => {
  const { name, value, percent, x, y, midAngle } = props;
  console.log(props)
  return (
    <g transform={`translate(${x}, ${y})`} textAnchor={ (midAngle < -90 || midAngle >= 90) ? 'end' : 'start'}>
      <text x={0} y={0}>{`${name}`}</text>
      <text x={0} y={20}>{`${value} (${(percent * 100).toFixed(2)}%)`}</text>
    </g>
  );
};

  return (
    <div >
      <p>
        {loading}
      </p>
      <p>
        {activeIndex}
      </p>
      <div className="pie-chart-wrapper" style={{ width: '100%', height: '1000px', backgroundColor: '#f5f5f5' }}>
          <PieChart width={400} height={400}>
            <Pie
              data={runtimes}
              dataKey="value"
              startAngle={180}
              endAngle={-180}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={10}
              label={renderLabelContent}
            >
              {
                runtimes.map((entry, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={colors[index % 10] as string}
                  />
                ))
              }
              <Label value="Runtimes" position="center"/>
            </Pie>
          </PieChart>
        <BarChart
            width={800}
            height={2000}
            data={clients}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            layout="vertical"
          >
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={200}/>
            <Tooltip />
            <Bar dataKey="count" fill="#387908">
              <LabelList position="right" />
            </Bar>
          </BarChart>
      </div>
    </div>
  );
}

export default App;
