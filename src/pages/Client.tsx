import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  LabelList, Bar, BarChart, XAxis, YAxis
} from 'recharts';

import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10} from 'd3-scale-chromatic';

import { Box, Grid, GridItem, Heading, useColorModeValue } from '@chakra-ui/react';
import { Card } from '../atoms/Card';
import { useParams } from 'react-router-dom';
import { Loader } from '../organisms/Loader';
import { SortedMap } from '../data/SortedMap';

const colors = scaleOrdinal(schemeCategory10).range();

interface NamedCount {
  name: string;
  count: number;
}

interface ClientData {
  versions: NamedCount[];
  operatingSystems: NamedCount[];
  languages: NamedCount[];
}

function Home() {
  const { id } = useParams<{ id: string }>();
  const color = useColorModeValue("gray.800", "white")
  const [data, setData] = useState<ClientData | undefined>()

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.protocol + window.location.host + '/v1/dashboard')
      const params = {
        "filter":  `[["name:${id}"]]`
      }
      url.search = new URLSearchParams(params).toString();
      const response = await fetch(url.toString())
      const json: ClientData = await response.json();


      setData(json)
    }

    run()

  }, [id])

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
            data={data.languages}
            dataKey="count"
            startAngle={180}
            endAngle={-180}
            innerRadius={30}
            outerRadius={100}
            paddingAngle={data.languages.length === 1 ? 0 : 20}
            minAngle={data.languages.length === 1 ? 0 : 20}
            label={renderLabelContent}
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
      </Card>
    </Grid>
  );
}

export default Home;
