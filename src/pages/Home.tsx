import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  LabelList, Bar, BarChart, XAxis, YAxis
} from 'recharts';

import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10} from 'd3-scale-chromatic';

import { ClientResponse } from '../data/DataProcessor';
import { useData } from '../data/DataContext';
import { Box, Grid, GridItem, Heading, useColorModeValue } from '@chakra-ui/react';
import { Card } from '../atoms/Card';
import { useHistory } from 'react-router-dom';
import { Loader } from '../organisms/Loader';

const colors = scaleOrdinal(schemeCategory10).range();

function Home() {
  const history = useHistory()
  const color = useColorModeValue("gray.800", "white")
  const db = useData()
  const [data, setData] = useState<ClientResponse>()

  useEffect(() => {
    const parsedClients = db.queryData({showOperatingSystemArchitecture: false, showRuntimeVersion: false})
    const topClient = parsedClients.clients.slice(0, 10)
    const othersSum = parsedClients.clients.slice(10).reduce((prev, curr) => {
      return prev + curr.count
    }, 0)
    
    topClient.push({name: 'others', count: othersSum})
    parsedClients.clients = topClient
    setData(parsedClients)

  }, [db])

  if (!data) {
    return <Loader>Processing data</Loader>
  }
  
  const renderLabelContent: React.FunctionComponent = (props: any) => {
    const { name, value, percent, x, y, midAngle } = props;
    return (
      <g transform={`translate(${x}, ${y})`} textAnchor={(midAngle < -90 || midAngle >= 90) ? 'end' : 'start'} fill={color}>
        <text x={0} y={0}>{`${name}`}</text>
        <text x={0} y={20}>{`${value} (${(percent * 100).toFixed(2)}%)`}</text>
      </g>
    );
  };

  const onClientClick = (e:any) => {
    history.push(`/${e.activePayload[0].payload.name}`)
  }
  
  return (
    <Grid gridGap="8" templateColumns="repeat(2, 1fr)" >
      <GridItem colSpan={2}>
        <Card title="Popular Clients">
          <BarChart
            width={1000}
            height={data.clients.length * 50}
            data={data.clients}
            layout="vertical"
            margin={{left: 60}}
            onClick={onClientClick}
          >
            <XAxis type="number"  stroke={color}/>
            <YAxis dataKey="name" type="category" stroke={color}/>
            <Tooltip cursor={false} />
            <Bar dataKey="count">
              {data.clients.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % 10]} />
              ))}
              <LabelList position="right" />
            </Bar>
          </BarChart>
        </Card>
      </GridItem>

      <Card title="Popular Operating Systems">
        <PieChart width={500} height={300}>
          <Pie
            data={data.operatingSystems}
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
              data.operatingSystems.map((entry, index) => (
                <Cell
                  key={`slice-${index}`}
                  fill={colors[index % 10] as string}
                />
              ))
            }
          </Pie>
        </PieChart>
      </Card>

      <Card title="Popular Client Runtimes">
        <PieChart width={500} height={300}>
          <Pie
            data={data.runtimes}
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
              data.runtimes.map((entry, index) => (
                <Cell
                  key={`slice-${index}`}
                  fill={colors[index % 10] as string}
                />
              ))
            }
          </Pie>
        </PieChart>
      </Card>
    </Grid>
  );
}

export default Home;
