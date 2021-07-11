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

export function generateFilterGroupsFromQueryString(queryString: string): FilterGroup[] {
  const rawFilters = new URLSearchParams(queryString).get('filter')
  if (!rawFilters) {
    return []
  }

  try {
    const parsedFilters: [string[]] = JSON.parse(rawFilters)
    if (!Array.isArray(parsedFilters)) {
      throw Error(`Invalid filters: ${rawFilters}`)
    }

    const filterGroup: FilterGroup[] = parsedFilters.map((unparsedFilters, idx) => {
      if (!Array.isArray(unparsedFilters)) {
        throw Error(`Invalid filter, item "${idx}" should be an array`)
      }

      return unparsedFilters.map((unparsedFilter, unparsedIdx) => {
        if (typeof unparsedFilter !== "string") {
          throw Error(`Invalid filter, item "${idx}" at "${unparsedIdx}" should be an array`)
        }

        const [name, value, operator] = unparsedFilter.split(":")
        if (operator && !(operator in FilterOperatorToSymbol)) {
          throw Error(`Invalid operator, item "${idx}" at "${unparsedIdx}" is invalid: ${operator}`)
        }

        if (!name && !value) {
          throw Error(`Invalid key/value, item "${idx}" at "${unparsedIdx}" is missing: ${name} and ${value}`)
        }

        return { name, value, operator } as Filter
      })
    })
    
    return filterGroup
  } catch (e) {
    throw Error(`Cannot parse filters: '${rawFilters}'. Reason: ${e}`)
  }
}

export function countTotalClientsInFilter(filters: FilterGroup[]) {
  return filters.reduce((groupCount, filterGroup) => {
    return groupCount + filterGroup.reduce((filterCount, filter) => {
      if (filter && filter.name === 'name') {
        filterCount++;
      }
      return filterCount;
    }, 0);
  }, 0);
}