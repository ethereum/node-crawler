import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { FilterGroup, generateQueryStringFromFilterGroups } from "./data/FilterUtils";

export const colors = scaleOrdinal(schemeCategory10).range();

export const normalizeClientNames: { [key: string]: string } = {
  'turbogeth': 'erigon',
  'turbo-geth': 'erigon',
}

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

export const londonFilter: FilterGroup[] = [
  [{ name: 'name', value: 'geth' }, { name: 'version_major', value: '1', operator: 'gte' }, { name: 'version_minor', value: '10', operator: 'gte' }, { name: 'version_patch', value: '6', operator: 'gte' }],
  [{ name: 'name', value: 'nethermind' }, { name: 'version_major', value: '1', operator: 'gte' }, { name: 'version_minor', value: '10', operator: 'gte' }, { name: 'version_patch', value: '79', operator: 'gte' }],
  [{ name: 'name', value: 'turbogeth' }, { name: 'version_major', value: '2021', operator: 'gte' }, { name: 'version_minor', value: '7', operator: 'gte' }, { name: 'version_patch', value: '4', operator: 'gte' }],
  [{ name: 'name', value: 'turbo-geth' }, { name: 'version_major', value: '2021', operator: 'gte' }, { name: 'version_minor', value: '7', operator: 'gte' }, { name: 'version_patch', value: '4', operator: 'gte' }],
  [{ name: 'name', value: 'erigon' }, { name: 'version_major', value: '2021', operator: 'gte' }, { name: 'version_minor', value: '7', operator: 'gte' }, { name: 'version_patch', value: '4', operator: 'gte' }],
  [{ name: 'name', value: 'besu' }, { name: 'version_major', value: '21', operator: 'gte' }, { name: 'version_minor', value: '7', operator: 'gte' }, { name: 'version_patch', value: '1', operator: 'gte' }],
  [{ name: 'name', value: 'openethereum' }, { name: 'version_major', value: '3', operator: 'gte' }, { name: 'version_minor', value: '3', operator: 'gte' }, { name: 'version_patch', value: '0', operator: 'gte' }],
  [{ name: 'name', value: 'ethereum-js' }, { name: 'version_major', value: '5', operator: 'gte' }, { name: 'version_minor', value: '5', operator: 'gte' }, { name: 'version_patch', value: '0', operator: 'gte' }],
]

export const londonFilterString = generateQueryStringFromFilterGroups(londonFilter)
export const knownNodesFilterString = generateQueryStringFromFilterGroups(knownNodesFilter)


export const LayoutEightPadding = [4, 4, 4, 8]
export const LayoutTwoColumn = ["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]
export const LayoutTwoColSpan = [1, 1, 1, 2]