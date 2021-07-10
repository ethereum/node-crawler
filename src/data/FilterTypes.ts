export type FilterOperator = "eq" | "not" | "lt" | "lte" | "gt" | "gte"

export const FilterOperatorToSymbol = {
  "eq": "=",
  "not": "!=",
  "lt": "<",
  "lte": "<=",
  "gt": ">",
  "gte": ">="
}

export interface Filter {
  name: string;
  value: string;
  operator?: FilterOperator;
}

export type FilterItem = Filter | undefined
export type FilterGroup = FilterItem[];

export function generateQueryStringFromFilterGroups(filterGroups: FilterGroup[]): string {
  return `?filter=${JSON.stringify(filterGroups.map(l => (l.map(f => {
    const tokens = [f?.name, f?.value]
    if (f?.operator) tokens.push(f?.operator)
    return tokens.join(':')
  }))))}`
}
