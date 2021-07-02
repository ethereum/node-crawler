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
import { useParams } from 'react-router-dom';
import { Loader } from '../organisms/Loader';

const colors = scaleOrdinal(schemeCategory10).range();

function Home() {
  const { id } = useParams<{ id: string }>();
  const color = useColorModeValue("gray.800", "white")
  const db = useData()
  const [data, setData] = useState<ClientResponse>()

  useEffect(() => {
    const parsedData = db.queryData({showOperatingSystemArchitecture: false, showRuntimeVersion: false}, [{name: id}])
    const topClient = parsedData.versions.slice(0, 10)
    const othersSum = parsedData.versions.slice(10).reduce((prev, curr) => {
      return prev + curr.count
    }, 0)
    
    topClient.push({name: 'others', count: othersSum})
    parsedData.versions = topClient
    setData(parsedData)
  }, [id, db])

  if (!data) {
    return <Loader>Processing {id} data</Loader>
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

  return (
    <Grid gridGap="8" templateColumns="repeat(2, 1fr)" >
      <Heading>{id}</Heading>
      <GridItem colSpan={2}>
        <Card title="Top Versions">
          <BarChart
            width={1000}
            height={(data.versions.length  || 0) * 50}
            data={data.versions}
            layout="vertical"
            margin={{left: 60}}
          >
            <XAxis type="number"  stroke={color}/>
            <YAxis dataKey="name" type="category" stroke={color}/>
            <Tooltip cursor={false} />
            <Bar dataKey="count">
              {data.versions.map((entry, index) => (
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
            outerRadius={100}
            paddingAngle={data.operatingSystems.length === 1 ? 0 : 10}
            minAngle={data.operatingSystems.length === 1 ? 0 : 20}
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
            paddingAngle={data.runtimes.length === 1 ? 0 : 20}
            minAngle={data.runtimes.length === 1 ? 0 : 20}
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
