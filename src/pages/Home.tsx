import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  LabelList, Bar, BarChart, XAxis, YAxis, ResponsiveContainer
} from 'recharts';

import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

import { Grid, GridItem, useColorModeValue } from '@chakra-ui/react';
import { Card } from '../atoms/Card';
import { useHistory, useLocation } from 'react-router-dom';
import { Loader } from '../organisms/Loader';
import { appendOtherGroup } from '../data/DataMassager';
import { FilterGroup, Filtering, ParseAndValidateFilters } from '../organisms/Filtering';

const colors = scaleOrdinal(schemeCategory10).range();

interface NamedCount {
  name: string;
  count: number;
}

interface TopResponse {
  clients: NamedCount[];
  operatingSystems: NamedCount[];
  languages: NamedCount[];
}

function Home() {
  const location = useLocation();
  const history = useHistory()
  const color = useColorModeValue("gray.800", "white")
  const [data, setData] = useState<TopResponse>()
  const [filters, setFilters] = useState<FilterGroup[]>([])

  useEffect(() => {
    const run = async () => {
      let search = ''
      try {
        setFilters(ParseAndValidateFilters(location.search));
        search = location.search
      } catch (e) {
        console.error(e);
      }

      const response = await fetch(`/v1/dashboard${search}`)
      const json: TopResponse = await response.json()

      json.clients = appendOtherGroup(json.clients)
      json.languages = appendOtherGroup(json.languages)
      json.operatingSystems = appendOtherGroup(json.operatingSystems)

      setData(json)
    }

    run()
  }, [location.search])

  if (!data) {
    return <Loader>Processing data</Loader>
  }

  const renderLabelContent: React.FunctionComponent = (props: any) => {
    const { name, value, percent, x, y, midAngle } = props;
    return (
      <g transform={`translate(${x}, ${y})`} textAnchor={(midAngle < -90 || midAngle >= 90) ? 'end' : 'start'} fill={color}>
        <text x={0} y={0}>{`${name || "unknown"}`}</text>
        <text x={0} y={20}>{`${value} (${(percent * 100).toFixed(2)}%)`}</text>
      </g>
    );
  };

  const onClientClick = (e: any) => {
    history.push(`/${e.activePayload[0].payload.name}`)
  }

  return (
    <Grid gridGap="8" templateColumns="repeat(2, 1fr)" w="100%">
      <GridItem colSpan={2}>
        <Filtering filters={filters}/>
      </GridItem>
      <GridItem colSpan={2}>
        <Card title="Popular Clients" w="99%" contentHeight={data.clients.length * 50}>
          <ResponsiveContainer>
            <BarChart
              height={data.clients.length * 50}
              data={data.clients}
              layout="vertical"
              margin={{ left: 60 }}
              onClick={onClientClick}
            >
              <XAxis type="number" stroke={color} />
              <YAxis dataKey="name" type="category" stroke={color} />
              <Tooltip cursor={false} />
              <Bar dataKey="count">
                {data.clients.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % 10]} />
                ))}
                <LabelList position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </GridItem>
      
      <Card title="Popular Operating Systems" w="99%" contentHeight={300}>
        <ResponsiveContainer>
          <PieChart>
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

      <Card title="Popular Client Runtimes" w="99%" contentHeight={300}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data.languages}
              dataKey="count"
              startAngle={180}
              endAngle={-180}
              innerRadius={30}
              outerRadius={100}
              paddingAngle={20}
              minAngle={20}
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
  );
}

export default Home;
