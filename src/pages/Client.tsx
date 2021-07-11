import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  LabelList, Bar, BarChart, XAxis, YAxis, ResponsiveContainer
} from 'recharts';

import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

import { Grid, GridItem, Heading, useColorModeValue } from '@chakra-ui/react';
import { Card } from '../atoms/Card';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { Loader } from '../organisms/Loader';
import { appendOtherGroup } from '../data/DataMassager';
import { LayoutEightPadding, LayoutTwoColSpan, LayoutTwoColumn } from '../config';
import { Filtering } from '../organisms/Filtering';
import { countTotalClientsInFilter, FilterGroup, generateFilterGroupsFromQueryString, generateQueryStringFromFilterGroups } from '../data/FilterTypes';
import { useCallback } from 'react';

const colors = scaleOrdinal(schemeCategory10).range();

interface NamedCount {
  name: string;
  count: number;
}

interface ClientData {
  versions: NamedCount[];
  versionsUnknown: number;
  operatingSystems: NamedCount[];
  operatingSystemsUnknown: number;
  languages: NamedCount[];
  languagesUnknown: number;
}

function Client() {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const color = useColorModeValue("gray.800", "white")
  const [data, setData] = useState<ClientData | undefined>()
  const [filters, setFilters] = useState<FilterGroup[]>()

  useEffect(() => {
    if (!id) {
      return;
    }

    let searchFilters: FilterGroup[] = []
    if (location.search) {
      try {
        searchFilters = generateFilterGroupsFromQueryString(location.search);
      } catch (e) {
        console.error(e);
      }
    } else {
      searchFilters = [
        [{name: 'name', value: id}]
      ]
    }
    
    setFilters(searchFilters)
  }, [id, location])

  useEffect(() => {
    if (!filters) {
      return;
    }

    const run = async () => {
      const response = await fetch(`/v1/dashboard${generateQueryStringFromFilterGroups(filters)}`)
      const json: ClientData = await response.json();

      const [versions, unknownVersionsCount] = appendOtherGroup(json.versions)
      const [languages, unknownLanguagesCount] = appendOtherGroup(json.languages)
      const [operatingSystems, unknownOperatingSystemsCount] = appendOtherGroup(json.operatingSystems)

      json.versions = versions
      json.versionsUnknown = unknownVersionsCount
      json.languages = languages
      json.languagesUnknown = unknownLanguagesCount
      json.operatingSystems = operatingSystems
      json.operatingSystemsUnknown = unknownOperatingSystemsCount

      setData(json)
    }

    run()

  }, [filters])

  const onFiltersChanged = useCallback((filters: FilterGroup[]) => {
    const nameCount = countTotalClientsInFilter(filters)
    history.push((nameCount === 1 && filters.length === 1 ? location.pathname : '/') + generateQueryStringFromFilterGroups(filters))
  }, [history, location]);

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
    <Grid gridGap={LayoutEightPadding} templateColumns={LayoutTwoColumn} w="100%">
      <Heading>{id}</Heading>
      <GridItem colSpan={LayoutTwoColSpan}>
        <Filtering filters={filters} onFiltersChange={onFiltersChanged} />
      </GridItem>
      <GridItem colSpan={LayoutTwoColSpan}>
        <Card title="Top Versions" w="99%" contentHeight={data.versions.length * 40}>
          <ResponsiveContainer>
            <BarChart
              data={data.versions}
              layout="vertical"
              margin={{ left: 60 }}
            >
              <XAxis type="number" stroke={color} hide />
              <YAxis dataKey="name" type="category" stroke={color} interval={0} />
              <Tooltip cursor={false} />
              <Bar dataKey="count">
                {data.versions.map((entry, index) => (
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
              paddingAngle={data.languages.length === 1 ? 0 : 20}
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
  );
}

export default Client;
