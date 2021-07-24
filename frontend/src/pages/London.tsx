import { Grid, GridItem, useColorModeValue, Table, Thead, Tbody, Td, Th, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { ResponsiveContainer, Cell, Pie, PieChart } from "recharts";
import { Card } from "../atoms/Card";
import { londonFilterString, knownNodesFilterString, normalizeClientNames, londonFilter, colors, LayoutEightPadding, LayoutTwoColSpan, LayoutTwoColumn } from "../config";
import { Filtering } from "../organisms/Filtering";
import { Loader } from "../organisms/Loader";

interface Distribution {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface NamedCount {
  name: string;
  count: number;
  total: number;
  readyPercentage: number;
  notReadyPercentage: number;
}

interface ClientData {
  clients: NamedCount[];
  operatingSystems: NamedCount[];
  languages: NamedCount[];
  distribution: Distribution[]
}

type NamedCountMap = { [name: string]: NamedCount }

function convertListToMap(list: NamedCount[]): NamedCountMap {
  return list.reduce((map: NamedCountMap, item) => {
    map[normalizeClientNames[item.name] || item.name] = item;
    return map;
  }, {});
}

function processItem(readyMap: NamedCountMap, item: NamedCount) {
  item.total = item.count
  item.count = item.name in readyMap ? readyMap[item.name].count : 0
  item.readyPercentage = Math.ceil(item.count / item.total * 100)
  item.notReadyPercentage = Math.ceil((item.total - item.count) / item.total * 100)
  return item
}

export function London() {
  const color = useColorModeValue("gray.800", "gray")
  const [data, setData] = useState<ClientData>()

  useEffect(() => {
    const run = async () => {
      const responseAll = await fetch(`/v1/dashboard${knownNodesFilterString}`)
      const responseReady = await fetch(`/v1/dashboard${londonFilterString}`)
      const allJson: ClientData = await responseAll.json()
      const readyJson: ClientData = await responseReady.json()

      const readyClientsMap = convertListToMap(readyJson.clients)

      allJson.clients = allJson.clients.map((item) => processItem(readyClientsMap, item))
      allJson.languages = readyJson.languages
      allJson.operatingSystems = readyJson.operatingSystems

      let readyCount = 0
      let notReadyCount = 0
      allJson.clients.forEach(c => {
        readyCount += c.count
        notReadyCount += c.total - c.count
      })

      let totalCount = readyCount + notReadyCount

      allJson.distribution = [
        { name: 'Ready', count: readyCount, percentage: Math.ceil(readyCount / totalCount * 100), color: '#7fda91' },
        { name: 'Not ready', count: notReadyCount, percentage: Math.ceil(notReadyCount / totalCount * 100), color: '#ff6c6c' }
      ]

      setData(allJson)
    }

    run()
  }, [])

  if (!data) {
    return <Loader>Loading data...</Loader>
  }

  const renderLabelContent = (props: any): any => {
    const { name, value, percent, x, y, midAngle } = props;
    return (
      <g transform={`translate(${x}, ${y})`} textAnchor={(midAngle < -90 || midAngle >= 90) ? 'end' : 'start'} fill={color}>
        <text x={0} y={0}>{`${name || "unknown"}`}</text>
        <text x={0} y={20}>{`${value} (${(percent * 100).toFixed(2)}%)`}</text>
      </g>
    );
  };

  return (
    <Grid gridGap={LayoutEightPadding} templateColumns={LayoutTwoColumn} w="100%">
      <GridItem colSpan={LayoutTwoColSpan}>
        <Filtering filters={londonFilter} />
      </GridItem>
      <Card title="London Clients" w="99%" contentHeight={data.clients.length * 40} h="100%">
        <Table>
          <Thead>
            <Tr>
              <Th>Client</Th>
              <Th>Ready</Th>
              <Th>Not-Ready</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.clients.map((item, index) => (
              <Tr key={index}>
                <Td>{item.name}</Td>
                <Td>{item.count} ({item.readyPercentage}%)</Td>
                <Td>{item.total - item.count} ({item.notReadyPercentage}%)</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
      <Card title="London Client Distribution" w="99%" contentHeight={300}>
        <ResponsiveContainer height={300}>
          <PieChart>
            <Pie
              data={data.distribution}
              stroke="none"
              dataKey="count"
              startAngle={180}
              endAngle={-180}
              minAngle={20}
              outerRadius={100}
              label={renderLabelContent}
              isAnimationActive={false}
            >
              {
                data.distribution.map((entry, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={entry.color}
                  />
                ))
              }
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="London Operating Systems" w="99%" contentHeight={300}>
        <ResponsiveContainer height={300}>
          <PieChart>
            <Pie
              data={data.operatingSystems}
              dataKey="count"
              startAngle={180}
              endAngle={-180}
              innerRadius={30}
              outerRadius={100}
              paddingAngle={data.operatingSystems.length === 1 ? 0 : 10}
              minAngle={data.operatingSystems.length === 1 ? 0 : 20}
              label={renderLabelContent}
              isAnimationActive={false}
            >
              {
                data.operatingSystems.map((entry, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={colors[index % 10] as string}
                  />
                ))
              }
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="London Runtimes" w="99%" contentHeight={300}>
        <ResponsiveContainer height={300}>
          <PieChart>
            <Pie
              data={data.languages}
              dataKey="count"
              startAngle={180}
              endAngle={-180}
              innerRadius={30}
              outerRadius={100}
              paddingAngle={data.languages.length === 1 ? 0 : 10}
              minAngle={data.languages.length === 1 ? 0 : 20}
              label={renderLabelContent}
              isAnimationActive={false}
            >
              {
                data.languages.map((entry, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={colors[index % 10] as string}
                  />
                ))
              }
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </Grid>
  )
}
