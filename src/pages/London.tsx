import { Grid, GridItem, useColorModeValue } from "@chakra-ui/react";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, LabelList, Tooltip, CartesianGrid } from "recharts";
import { Card } from "../atoms/Card";
import { FilterGroup, Filtering } from "../organisms/Filtering";
import { Loader } from "../organisms/Loader";

const colors = scaleOrdinal(schemeCategory10).range();

interface NamedCount {
  name: string;
  count: number;
  total: number;
  currentPercentage: number;
  totalPercentage: number;
}

interface ClientData {
  clients: NamedCount[];
  operatingSystems: NamedCount[];
  languages: NamedCount[];
}

const london: FilterGroup[] = [
  [{ name: 'name', value: 'geth' }, { name: 'major', value: '1', operator: 'gte' }, { name: 'minor', value: '10', operator: 'gte' }, { name: 'patch', value: '4', operator: 'gte' }],
  [{ name: 'name', value: 'nethermind' }, { name: 'major', value: '1', operator: 'gte' }, { name: 'minor', value: '10', operator: 'gte' }, { name: 'patch', value: '73', operator: 'gte' }],
  [{ name: 'name', value: 'turbogeth' }, { name: 'major', value: '2021', operator: 'gte' }, { name: 'minor', value: '6', operator: 'gte' }, { name: 'patch', value: '4', operator: 'gte' }],
  [{ name: 'name', value: 'turbo-geth' }, { name: 'major', value: '2021', operator: 'gte' }, { name: 'minor', value: '6', operator: 'gte' }, { name: 'patch', value: '4', operator: 'gte' }],
  [{ name: 'name', value: 'erigon' }, { name: 'major', value: '2021', operator: 'gte' }, { name: 'minor', value: '6', operator: 'gte' }, { name: 'patch', value: '4', operator: 'gte' }],
  [{ name: 'name', value: 'besu' }, { name: 'major', value: '21', operator: 'gte' }, { name: 'minor', value: '7', operator: 'gte' }, { name: 'patch', value: '0', operator: 'gte' }],
  [{ name: 'name', value: 'openethereum' }, { name: 'major', value: '3', operator: 'gte' }, { name: 'minor', value: '3', operator: 'gte' }, { name: 'patch', value: '0', operator: 'gte' }],
  [{ name: 'name', value: 'ethereum-js' }, { name: 'major', value: '5', operator: 'gte' }, { name: 'minor', value: '4', operator: 'gte' }, { name: 'patch', value: '1', operator: 'gte' }],
]

const normalizeNames: { [key: string]: string } = {
  'turbogeth': 'erigon',
  'turbo-geth': 'erigon',
}

const londonFilter = JSON.stringify(london.map(l => (l.map(f => {
  const tokens = [f?.name, f?.value]
  if (f?.operator) tokens.push(f?.operator)
  return tokens.join(':')
}))))

const londonAllFilter = JSON.stringify(london.map(l => ([`name:${l[0]?.value}`])))

type NamedCountMap = { [name: string]: NamedCount }

function convertListToMap(list: NamedCount[]): NamedCountMap {
  return list.reduce((map: NamedCountMap, item) => {
    map[normalizeNames[item.name] || item.name] = item;
    return map;
  }, {});
}

function processItem(readyMap: NamedCountMap, item: NamedCount) {
  item.total = item.count
  item.count = item.name in readyMap ? readyMap[item.name].count : 0
  item.totalPercentage = 100
  item.currentPercentage = Math.ceil(item.count / item.total * 100)
  return item
}

export function London() {
  const color = useColorModeValue("gray.800", "white")
  const [data, setData] = useState<ClientData>()

  useEffect(() => {
    const run = async () => {
      const responseAll = await fetch(`/v1/dashboard?filter=${londonAllFilter}`)
      const responseReady = await fetch(`/v1/dashboard?filter=${londonFilter}`)
      const allJson: ClientData = await responseAll.json()
      const readyJson: ClientData = await responseReady.json()

      const readyClientsMap = convertListToMap(readyJson.clients)
      const readyOperatingSystemsMap = convertListToMap(readyJson.operatingSystems)
      const readyLanguagesMap = convertListToMap(readyJson.languages)

      allJson.languages = allJson.languages.map((item) => processItem(readyLanguagesMap, item))
      allJson.operatingSystems = allJson.operatingSystems.map((item) => processItem(readyOperatingSystemsMap, item))
      allJson.clients = allJson.clients.map((item) => processItem(readyClientsMap, item))

      setData(allJson)
    }

    run()
  }, [])

  if (!data) {
    return <Loader>Processing data</Loader>
  }

  const renderLabelContent = (props: any): any => {
    const { name, value, width, x, y, } = props;
    console.log(props)
    return (
      <g transform={`translate(${width}, ${y})`} textAnchor="end" fill={color}>
        <text x={0} y={20}>{`${value} (${(value * 100).toFixed(2)}%)`}</text>
      </g>
    );
  };


  return (
    <Grid gridGap="8" templateColumns="repeat(2, 1fr)" w="100%">
      <GridItem colSpan={2}>
        <Filtering filters={london} />
      </GridItem>
      <GridItem colSpan={2}>
        <Card title="London ready clients" w="99%" contentHeight={data.clients.length * 50}>
          <ResponsiveContainer>
            <BarChart data={data.clients}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <XAxis type="number" stroke={color} />
              <YAxis dataKey="name" type="category" yAxisId={0} />
              <YAxis dataKey="name" type="category" yAxisId={1} hide />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip cursor={false} />
              <Bar dataKey="totalPercentage" barSize={40} yAxisId={1} fill="#ccc">
                <LabelList position="insideRight" content={renderLabelContent} />
              </Bar>
              <Bar dataKey="currentPercentage" barSize={20} yAxisId={0} fill="#8884d8" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </GridItem>
    </Grid>
  )
}
