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

export function cleanFilterGroup(groups: FilterGroup[]) {
  const cache = new Set<string>()
  const hashGroup = (filterGroup: FilterGroup) => {
    return filterGroup.map(filter => {
      if (!filter) return undefined
      return `${filter.name}=${filter.value}`
    }).filter(f => !!f).sort((a: any, b: any) => b - a).join('&')
  }

  return groups.filter(f => {
    const hash = hashGroup(f);
    if (!cache.has(hash)) {
      cache.add(hash); 
      return true;
    }
    return false;
  })
}

export interface UniqueFilters {
  name: string;
  value: string;
}

export function getUniqueFilters(groups: FilterGroup[] | undefined): UniqueFilters[] {
  if (!groups) {
    return []
  }
  
  const cache = new Map<string, number>()

  groups.forEach(group => {
    group.forEach(filter => {
      if (!filter) return;
      const key = `${filter.name}|${filter.value}`
      cache.set(key, (cache.get(key) || 0) + 1)
    })
  })

  const processedFilters = [...cache.entries()].filter(f => f[1] === groups.length).map(f => {
    const [ name, value ] = f[0].split('|')
    return {
      name,
      value
    }
  })

  let versionString = {
    major: '',
    minor: '',
    patch: ''
  }

  const postProcess = processedFilters.reduce((acc: UniqueFilters[], filter) => {
    if (filter.name.startsWith('version_')) {
      const versionType = filter.name.substr('version_'.length) as 'major' | 'minor' | 'patch'
      versionString[versionType] = filter.value
    } else {
      acc.push(filter);
    }
    return acc
  }, [])

  if (versionString.major || versionString.minor || versionString.patch) {
    postProcess.push({
      name: 'version',
      value: `${versionString.major || 0}.${versionString.minor || 0}.${versionString.patch || 0}`
    })
  }

  return postProcess
}

  
export const drilldownFilter = (filters: FilterGroup[] | undefined, name: string, value: string) => {
  const set = (filterGroup: FilterGroup, name: string, value: string) => {
    const nameFoundIndex = filterGroup.findIndex(fg => fg?.name === name);
    if (nameFoundIndex !== -1) {
      filterGroup[nameFoundIndex]!.value = value
    } else {
      filterGroup.push({ name, value: value })
    }
  }

  const newFilters = [...filters || []]
  if (newFilters.length === 0) {
    newFilters.push([{name, value: value}])
  } else {
    newFilters.forEach(filterGroup => {
      if (name === 'version') {
        const versions = value.split('.')
        if (versions.length >= 1) {
          set(filterGroup, 'version_major', versions[0]);
        }
        if (versions.length >= 2) {
          set(filterGroup, 'version_minor', versions[1]);
        }
        if (versions.length >= 3) {
          set(filterGroup, 'version_patch', versions[2]);
        }
      } else {
        set(filterGroup, name, value);
      }
    })
  }
  
  return cleanFilterGroup(newFilters);
}

export function filterCount(filters: FilterGroup[] | undefined): number {
  if (!filters || filters.length === 0)
    return 0

  return filters.reduce((prev, curr) => prev + curr.length, 0) || 0;
}