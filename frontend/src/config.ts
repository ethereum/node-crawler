import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { FilterGroup, generateQueryStringFromFilterGroups } from "./data/FilterUtils";

export const colors = scaleOrdinal(schemeCategory10).range();

export const knownNodesFilter: FilterGroup[] = [
  [{ name: 'name', value: 'geth' }],
  [{ name: 'name', value: 'nethermind' }],
  [{ name: 'name', value: 'turbogeth' }],
  [{ name: 'name', value: 'turbo-geth' }],
  [{ name: 'name', value: 'erigon' }],
  [{ name: 'name', value: 'besu' }],
  [{ name: 'name', value: 'openethereum' }],
  [{ name: 'name', value: 'ethereum-js' }]
]

export const knownNodesFilterString = generateQueryStringFromFilterGroups(knownNodesFilter)

export const LayoutEightPadding = [4, 4, 4, 8]
export const LayoutTwoColumn = ["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]
export const LayoutTwoColSpan = [1, 1, 1, 2]
