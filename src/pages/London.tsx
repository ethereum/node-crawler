import { Grid, GridItem, useColorModeValue, Text } from "@chakra-ui/react";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, Cell, TooltipProps } from "recharts";
import { Card } from "../atoms/Card";
import { TooltipCard } from "../atoms/TooltipCard";
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
  const color = useColorModeValue("gray.800", "gray")
  const barBackroundColor = useColorModeValue("rgba(255,255,255,0.3)", "rgba(0,0,0,0.3)")
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
    const { height, width, x, y, index } = props;
    const entity = data.clients[index]
    const fontSize = 12
    return (
      <g transform={`translate(${width + x}, ${y})`} textAnchor="end">
        <text fill={color} fontSize={fontSize} x={-15} y={(height + fontSize) / 2}>{`${entity.total} (${entity.currentPercentage}%)`}</text>
      </g>
    );
  };

  const renderTooltipContent = (props: TooltipProps<any, any>): React.ReactElement | null => {
    if (!props.active || !props.payload) {
      return null
    }

    const payload: NamedCount = (props.payload as any)[0].payload
    const notReadyCount = payload.total - payload.count
    return (
      <TooltipCard>
        <Text fontWeight="bold">{payload.name}</Text>
        <Text>Ready: {payload.count} ({payload.currentPercentage}%)</Text>
        <Text>Not ready: {notReadyCount} ({Math.ceil(notReadyCount / payload.total * 100)}%)</Text>
      </TooltipCard>
    )
  }

  return (
    <Grid gridGap="8" templateColumns="repeat(2, 1fr)" w="100%">
      <GridItem colSpan={2}>
        <Filtering filters={london} />
      </GridItem>
      <GridItem colSpan={2}>
        <Card title="London ready clients" w="99%" contentHeight={data.clients.length * 40}>
          <ResponsiveContainer>
            <BarChart data={data.clients}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" yAxisId={0} />
              <YAxis dataKey="name" type="category" yAxisId={1} hide />
              <Tooltip cursor={false} content={renderTooltipContent} />
              <Bar dataKey="totalPercentage" yAxisId={1} fill={barBackroundColor} label={renderLabelContent} />
              <Bar dataKey="currentPercentage" yAxisId={0}>
                {data.clients.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % 10]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </GridItem>
    </Grid>
  )
}
