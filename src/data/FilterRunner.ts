export const matchesFilter = (client: any, filter: any): boolean => {
    const entries = Object.entries(filter)
    let matchesAll = entries.length

    for (const [key, value]  of entries) {
      if (typeof value === 'object') {
        if (matchesFilter(client[key], value)) {
          matchesAll--
        }
      }

      const clientValue = client[key] as number | string
      const filterValue = value as number | string

      if (typeof clientValue === 'number' && typeof filterValue === 'string') {
        const numberMatches = filterValue.match(/(?<operator>\w+)\s*(?<value>\d+)/)
        if (numberMatches?.groups) {
          const operator = numberMatches.groups.operator
          const value = parseFloat(numberMatches.groups.value)

          switch (operator) {
            case 'gt': {
              if (clientValue > value) matchesAll--
              break;
            }
            case 'gte': {
              if (clientValue >= value) matchesAll--
              break;
            }
            case 'lt': {
              if (clientValue < value) matchesAll--
              break;
            }
            case 'lte': {
              if (clientValue <= value) matchesAll--
              break;
            }
            default: {
              console.warn(`Invalid conditional operator: "${operator}"`)
              break;
            }
          }
        }
      }
      else if (value === clientValue) {
        matchesAll--
      }
    }

    return (matchesAll === 0)
  }