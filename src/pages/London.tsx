import { Grid, GridItem, useColorModeValue, Text } from "@chakra-ui/react";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Cell, LabelList, Tooltip, CartesianGrid } from "recharts";
import { isIfStatement } from "typescript";
import { Card } from "../atoms/Card";
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

const londonFilter = JSON.stringify([
	["name:geth", "major:1:gte", "minor:10:gte", "patch:4:gte"],
	["name:nethermind", "major:1:gte", "minor:10:gte", "patch:73:gte"],
	["name:turbogeth", "major:2021:gte", "minor:6:gte", "patch:4:gte"],
	["name:turbo-geth", "major:2021:gte", "minor:6:gte", "patch:4:gte"],
	["name:erigon", "major:2021:gte", "minor:6:gte", "patch:4:gte"],
	["name:besu", "major:21:gte", "minor:7:gte", "patch:0:gte"],
	["name:openethereum", "major:3:gte", "minor:3:gte", "patch:0:gte"],
	["name:ethereum-js", "major:5:gte", "minor:4:gte", "patch:1:gte"]
])

const londonAllFilter = JSON.stringify([
	["name:geth"],
	["name:nethermind"],
	["name:turbogeth"],
	["name:turbo-geth"],
	["name:erigon"],
	["name:besu"],
	["name:openethereum"],
	["name:ethereum-js"]
])


export function London() {
  const color = useColorModeValue("gray.800", "white")
	const [data, setData] = useState<ClientData>()

	useEffect(() => {
		const run = async () => {
			const responseAll = await fetch(`/v1/dashboard?filter=${londonAllFilter}`)
			const responseReady = await fetch(`/v1/dashboard?filter=${londonFilter}`)
			const allJson: ClientData = await responseAll.json()
			const readyJson: ClientData = await responseReady.json()

			readyJson.languages = readyJson.languages.map((item, idx) => {
				item.total = allJson.languages[idx].count
				item.totalPercentage = 100
				item.currentPercentage = Math.ceil(item.count / item.total * 100)
				return item
			})

			readyJson.operatingSystems = readyJson.operatingSystems.map((item, idx) => {
				item.total = allJson.operatingSystems[idx].count
				item.totalPercentage = 100
				item.currentPercentage = Math.ceil(item.count / item.total * 100)
				return item
			})

			readyJson.clients = readyJson.clients.map((item, idx) => {
				item.total = allJson.clients[idx].count
				item.totalPercentage = 100
				item.currentPercentage = Math.ceil(item.count / item.total * 100)
				return item
			})
			console.log(readyJson)
			setData(readyJson)
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
				<Card title="London ready clients" w="99%" contentHeight={data.clients.length * 50}>
					<ResponsiveContainer>
					<BarChart data={data.clients} 
              layout="vertical"
            margin={{top: 5, right: 30, left: 20, bottom: 5}}>
              <XAxis type="number" stroke={color} />
              <YAxis dataKey="name" type="category" yAxisId={0} />
              <YAxis dataKey="name" type="category" yAxisId={1} hide />
       				<CartesianGrid strokeDasharray="3 3"/>
							<Tooltip cursor={false} />
							<Bar dataKey="totalPercentage" barSize={40} yAxisId={1} fill="#ccc">
                <LabelList position="insideRight" content={renderLabelContent} />
							</Bar>
							<Bar dataKey="currentPercentage" barSize={20}  yAxisId={0} fill="#8884d8" fillOpacity={0.7}/>
						</BarChart>
					</ResponsiveContainer>
				</Card>
			</GridItem>
		</Grid>
	)
}
