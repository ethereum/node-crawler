import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector,
  Label, LabelList, Bar, BarChart, XAxis, YAxis
} from 'recharts';

import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10} from 'd3-scale-chromatic';

import { GetClientResponse } from '../data/DataProcessor';
import { useData } from '../data/DataContext';
import { Box, Heading, others } from '@chakra-ui/react';
import { Card } from '../atoms/Card';


const colors = scaleOrdinal(schemeCategory10).range();

const ClientParser = {
  'Geth': '1.10.4',
  'Nethermind': '1.10.73',
  'turbogeth': '2021.06.04-alpha',
  'besu': '21.7.0-RC1',
  'OpenEthereum': '3.3.0-rc2',
  'ethereumjs': '5.4.1'
}


interface LoadingResponse {
  status: 'loading'
}
function Home() {
  const data = useData()
  const [runtimes, setRuntimes] = useState([])
  const [clients, setClients] = useState<GetClientResponse[]>([])
  const [topClients, setTopClients] = useState<GetClientResponse[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const parsedClients = data.getClients()
    const topClient = parsedClients.slice(0, 10)
    const othersSum = parsedClients.slice(10).reduce((prev, curr) => {
      return prev + curr.count
    }, 0)
    
    topClient.push({name: 'others', count: othersSum})
    setClients(topClient)
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
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
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
    return (
      <g transform={`translate(${x}, ${y})`} textAnchor={(midAngle < -90 || midAngle >= 90) ? 'end' : 'start'}>
        <text x={0} y={0}>{`${name}`}</text>
        <text x={0} y={20}>{`${value} (${(percent * 100).toFixed(2)}%)`}</text>
      </g>
    );
  };

  return (
    <Box>
      <Card>
        <Heading size="sm">Popular Clients</Heading>
        <Box flex="1">
          <BarChart
            width={500}
            height={clients.length * 50}
            data={clients}
            layout="vertical"
          >
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Tooltip cursor={false} />
            <Bar dataKey="count">
              {clients.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % 10]} />
              ))}
              <LabelList position="right" />
            </Bar>
          </BarChart>
        </Box>
      </Card>

      <div className="pie-chart-wrapper" style={{ width: '100%', height: '1000px' }}>
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
            <Label value="Runtimes" position="center" />
          </Pie>
        </PieChart>
       
      </div>
    </Box >
  );
}

export default Home;
