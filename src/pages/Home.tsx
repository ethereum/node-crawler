import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  LabelList, Bar, BarChart, XAxis, YAxis
} from 'recharts';

import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10} from 'd3-scale-chromatic';

import { NameCountResponse } from '../data/DataProcessor';
import { useData } from '../data/DataContext';
import { Box, Grid, GridItem, Heading, useColorModeValue } from '@chakra-ui/react';
import { Card } from '../atoms/Card';


const colors = scaleOrdinal(schemeCategory10).range();

// const ClientParser = {
//   'Geth': '1.10.4',
//   'Nethermind': '1.10.73',
//   'turbogeth': '2021.06.04-alpha',
//   'besu': '21.7.0-RC1',
//   'OpenEthereum': '3.3.0-rc2',
//   'ethereumjs': '5.4.1'
// }

function Home() {
  const color = useColorModeValue("gray.800", "white")
  const data = useData()
  const [topOperatingSystems, setTopOperatingSystems] = useState<NameCountResponse[]>([])
  const [topRuntimes, setTopRuntimes] = useState<NameCountResponse[]>([])
  const [topClients, setTopClients] = useState<NameCountResponse[]>([])

  useEffect(() => {
    const parsedClients = data.getTopClients()
    const topClient = parsedClients.slice(0, 10)
    const othersSum = parsedClients.slice(10).reduce((prev, curr) => {
      return prev + curr.count
    }, 0)
    
    topClient.push({name: 'others', count: othersSum})
    setTopClients(topClient)

    setTopRuntimes(data.getTopRuntimes())
    setTopOperatingSystems(data.getTopOperatingSystems())
  }, [data])

  const renderLabelContent: React.FunctionComponent = (props: any) => {
    const { name, value, percent, x, y, midAngle } = props;
    return (
      <g transform={`translate(${x}, ${y})`} textAnchor={(midAngle < -90 || midAngle >= 90) ? 'end' : 'start'} fill={color}>
        <text x={0} y={0}>{`${name}`}</text>
        <text x={0} y={20}>{`${value} (${(percent * 100).toFixed(2)}%)`}</text>
      </g>
    );
  };

  return (
    <Grid gridGap="8" templateColumns="repeat(2, 1fr)" >
      <GridItem colSpan={2}>
        <Card>
          <Heading size="sm">Popular Clients</Heading>
          <Box flex="1" mt="4">
            <BarChart
              width={1000}
              height={topClients.length * 50}
              data={topClients}
              layout="vertical"
              margin={{left: 60}}
            >
              <XAxis type="number"  stroke={color}/>
              <YAxis dataKey="name" type="category" stroke={color}/>
              <Tooltip cursor={false} />
              <Bar dataKey="count">
                {topClients.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % 10]} />
                ))}
                <LabelList position="right" />
              </Bar>
            </BarChart>
          </Box>
        </Card>
      </GridItem>

      <Card>
        <Heading size="sm">Popular Operating Systems</Heading>
        <Box flex="1">
          <PieChart width={500} height={300}>
            <Pie
              data={topOperatingSystems}
              dataKey="count"
              startAngle={180}
              endAngle={-180}
              innerRadius={30}
              minAngle={20}
              outerRadius={100}
              paddingAngle={10}
              label={renderLabelContent}
            >
              {
                topOperatingSystems.map((entry, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={colors[index % 10] as string}
                  />
                ))
              }
            </Pie>
          </PieChart>
        </Box>
      </Card>

      <Card>
        <Heading size="sm">Popular Client Runtimes</Heading>
        <Box flex="1">
          <PieChart width={500} height={300}>
            <Pie
              data={topRuntimes}
              dataKey="count"
              startAngle={180}
              endAngle={-180}
              innerRadius={30}
              outerRadius={100}
              paddingAngle={20}
              minAngle={20}
              label={renderLabelContent}
            >
              {
                topRuntimes.map((entry, index) => (
                  <Cell
                    key={`slice-${index}`}
                    fill={colors[index % 10] as string}
                  />
                ))
              }
            </Pie>
          </PieChart>
        </Box>
      </Card>
    </Grid>
  );
}

export default Home;
