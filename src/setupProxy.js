// const fetch = require('node-fetch');
const fs = require('fs');

const matchAll = require('string.prototype.matchall')

function SortedMap(comparator) {
    const obj = new Map();
    obj[Symbol.iterator] = function* () {
        yield* [...this.entries()].sort(comparator);
    };
    return {
        size: () => obj.size,
        clear: () => obj.clear(),
        delete: (key) => obj.delete(key),
        forEach: (callbackfn, thisArg) => obj.forEach(callbackfn, thisArg),
        get: (key) => obj.get(key),
        has: (key) => obj.has(key),
        set: (key, value) => obj.set(key, value),
        map: (callbackfn, thisArg) => {
            return [...obj].map(callbackfn, thisArg);
        },
        iterator: obj
    };
}

const matchesFilter = (client, filter) => {
    const entries = Object.entries(filter);
    let matchesAll = entries.length;
    for (const [key, value] of entries) {
        if (typeof value === 'object') {
            if (matchesFilter(client[key], value)) {
                matchesAll--;
            }
        }
        const clientValue = client[key];
        const filterValue = value;
        if (typeof clientValue === 'number' && typeof filterValue === 'string') {
            const numberMatches = filterValue.match(/(?<operator>\w+)\s*(?<value>\d+)/);
            if (numberMatches === null || numberMatches === void 0 ? void 0 : numberMatches.groups) {
                const operator = numberMatches.groups.operator;
                const value = parseFloat(numberMatches.groups.value);
                switch (operator) {
                    case 'gt': {
                        if (clientValue > value)
                            matchesAll--;
                        break;
                    }
                    case 'gte': {
                        if (clientValue >= value)
                            matchesAll--;
                        break;
                    }
                    case 'lt': {
                        if (clientValue < value)
                            matchesAll--;
                        break;
                    }
                    case 'lte': {
                        if (clientValue <= value)
                            matchesAll--;
                        break;
                    }
                    default: {
                        console.warn(`Invalid conditional operator: "${operator}"`);
                        break;
                    }
                }
            }
        }
        else if (value === clientValue) {
            matchesAll--;
        }
    }
    return (matchesAll === 0);
};

const osMapping = {
    linux: "vendor",
    windows: "vendor",
    darwin: "vendor",
    x86_64: "architecture",
    x64: "architecture",
    amd64: "architecture"
};

function tryParseNumber(input) {
    return parseInt(input);
}

function parseVersion(version, parseOpt) {
    const matches = version.match(/v?(?<major>\d+)(?:.(?<minor>\d+).(?<patch>\d+)(?:-(?<tag>\w+)(?:-(?<build>[a-zA-Z0-9]+)(?:-(?<date>\d+))?)?)?)?/);
    if (!(matches === null || matches === void 0 ? void 0 : matches.groups)) {
        parseOpt.errorCallback('version', version, parseOpt.primaryKey);
        return undefined;
    }
    const minor = tryParseNumber(matches.groups.minor);
    const patch = tryParseNumber(matches.groups.patch);
    const tag = matches.groups.tag;
    const build = matches.groups.build;
    const date = matches.groups.date;
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ major: parseInt(matches.groups.major) }, minor !== undefined && { minor }), patch !== undefined && { patch }), tag && { tag }), build && { build }), date && { date });
}

function parseOs(os, parseOpt) {
    const match = matchAll(os, /(linux|windows|darwin|x86_64|x64|amd64)/g);
    const matches = Array.from(match);
    if (matches.length) {
        const result = {};
        matches.forEach((match) => {
            const value = match[1];
            const key = osMapping[value];
            result[key] = value;
        });
        return result;
    }
    parseOpt.errorCallback('os', os, parseOpt.primaryKey);
    return undefined;
}

function parseRuntime(runtime, parseOpt) {
    const matches = runtime.match(/(?<name>[a-zA-Z]+)?-?(?<version>[\d+.?]+)/);
    if (matches === null || matches === void 0 ? void 0 : matches.groups) {
        const name = matches.groups['name'];
        const version = parseVersion(matches.groups['version'], parseOpt);
        return Object.assign(Object.assign({}, name && { name }), { version });
    }
    parseOpt.errorCallback('runtime', runtime, parseOpt.primaryKey);
    return undefined;
}

function parseRaw(raw, parseOpt) {
    const tokenize = raw.split('/');
    let label;
    let version;
    let os;
    let runtime;
    if (tokenize.length === 5) {
        label = tokenize[1];
        version = parseVersion(tokenize[2], parseOpt);
        os = parseOs(tokenize[3], parseOpt);
        runtime = parseRuntime(tokenize[4], parseOpt);
    }
    else if (tokenize.length === 4) {
        version = parseVersion(tokenize[1], parseOpt);
        os = parseOs(tokenize[2], parseOpt);
        runtime = parseRuntime(tokenize[3], parseOpt);
    }
    else if (tokenize.length === 3) {
        version = parseVersion(tokenize[0], parseOpt);
        os = parseOs(tokenize[1], parseOpt);
        runtime = parseRuntime(tokenize[2], parseOpt);
    }
    else if (tokenize.length === 2) {
        os = parseOs(tokenize[0], parseOpt);
        runtime = parseRuntime(tokenize[1], parseOpt);
    }
    if (label || version || os || runtime) {
        return Object.assign(Object.assign(Object.assign(Object.assign({}, label && { label }), version && { version }), os && { os }), runtime && { runtime });
    }
    parseOpt.errorCallback('raw', raw, parseOpt.primaryKey);
    return undefined;
}

function ClientsProcessor(data, errorCallback) {
    const obj = {};
    const topRuntimes = new Map();
    const topOs = new Map();
    let primaryKey = 0;

    const parse = (item) => {
        primaryKey++;
		const clientId = item.clientId.toLowerCase();
        if (!clientId) {
            errorCallback('parse', 'empty client id', '');
            return undefined;
        }

        const matches = clientId.match(/(?<name>\w+)\/(?<raw>.+)/);
        if (matches === null || matches === void 0 ? void 0 : matches.groups) {
            const raw = parseRaw(clientId, { primaryKey, errorCallback: (entity, data, pk) => {
                    errorCallback(entity, data, `${pk}: "${clientId}"`);
                }, raw: clientId });

            if (!raw) {
                return undefined;
            }

            if (raw.runtime) {
                const runtimeName = raw.runtime.name || 'Unknown';
                topRuntimes.set(runtimeName, (topRuntimes.get(runtimeName) || 0) + item.count);
            }

            if (raw.os) {
                const osName = raw.os.vendor || 'Unknown';
                topOs.set(osName, (topOs.get(osName) || 0) + item.count);
            }

            return Object.assign({ primaryKey, name: matches.groups.name, count: item.count }, raw);
        }

        errorCallback('parse', clientId, '');
        return undefined;
    };

    const matchesFilters = (client, filters) => {
        if (!filters || !filters.length) {
            return true;
        }

        return filters.some(f => matchesFilter(client, f));
    };

    const queryData = (options = {}, filters) => {
        const convert = (a) => ({
            name: a[0],
            count: a[1]
        });

        const versionToString = (version) => {
            let versionString = '' + version.major;
            if (version.minor !== undefined) {
                versionString += '.' + version.minor;
            }

            if (version.patch !== undefined) {
                versionString += '.' + version.patch;
            }

            if (version.tag !== undefined) {
                versionString += '-' + version.tag;
            }

            return versionString;
        };

        const runtimeToString = (runtime) => {
            let runtimeString = '';
            if (runtime.name) {
                runtimeString += runtime.name;
            }

            if (options.showRuntimeVersion && runtime.version) {
                runtimeString += versionToString(runtime.version);
            }

            return runtimeString;
        };

        const operatingSystemToString = (os) => {
            let osString = [];
            if (os.vendor) {
                osString.push(os.vendor);
            }

            if (options.showOperatingSystemArchitecture && os.architecture) {
                osString.push(os.architecture);
            }
            return osString.join('-');
        };

        const cache = {
            clients: SortedMap((a, b) => b[1] - a[1]),
            versions: SortedMap((a, b) => b[1] - a[1]),
            runtimes: SortedMap((a, b) => b[1] - a[1]),
            operatingSystems: SortedMap((a, b) => b[1] - a[1])
        };
        for (let a in obj) {
            const client = obj[a];

            if (matchesFilters(client, filters)) {
                cache.clients.set(client.name, (cache.clients.get(client.name) || 0) + client.count);

                if (client.version) {
                    const versionString = versionToString(client.version);
                    cache.versions.set(versionString, (cache.versions.get(versionString) || 0) + client.count);
                }

                if (client.runtime) {
                    const runtimeString = runtimeToString(client.runtime);
                    cache.runtimes.set(runtimeString, (cache.runtimes.get(runtimeString) || 0) + client.count);
                }

                if (client.os) {
                    const osString = operatingSystemToString(client.os);
                    cache.operatingSystems.set(osString, (cache.operatingSystems.get(osString) || 0) + client.count);
                }
            }
        }

        return {
            clients: cache.clients.map(convert),
            versions: cache.versions.map(convert),
            languages: cache.runtimes.map(convert),
            operatingSystems: cache.operatingSystems.map(convert)
        };
    };
    const getRaw = () => {
        return Object.keys(obj).map(o => obj[parseInt(o)]);
    };
    data.forEach((item) => {
        const parsedItem = parse(item);
        if (parsedItem) {
            obj[parsedItem.primaryKey] = parsedItem;
        }
    });
    return {
        obj,
        getRaw,
        queryData
    };
}

let clients;

async function writeCache(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile('./clients.json', data, 'utf8', (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function cacheCall() {
  return new Promise((resolve, reject) => {
    fs.readFile('./clients.json', 'utf-8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        clients = JSON.parse(data)
        resolve(clients)
      }
    })
  })
}

async function apiCall() {
  try {
    const response = await fetch(process.env.CRAWLER_API_URL);
    clients = await response.json()
    if (clients && clients.length) {
      await writeCache(clients)
      return clients
    } else {
      console.info('Clients was empty, read from cache.');
      return cacheCall()
    }
  } catch (e) {
    console.info('Tuweni API is down, read from cache.');
    return cacheCall()
  }
}

async function fetchClients() {
  if (clients && clients.length) {
    console.info('Clients read from cache.');
    return clients
  }

  return cacheCall()
}

module.exports = async (app) => {
  app.get('/v1/dashboard', async (req, resp) => { 
	const response = await fetchClients()
	const proc = ClientsProcessor(response, (err) => {
		console.error(err)
	})

	const filters = []
    let foundAtMostOneName = 0
	if (req.query.filters) {

		const parsedFilter = JSON.parse(req.query.filters.toLowerCase())
		if (parsedFilter.length) {
			parsedFilter.forEach((filter) => {
				const filterObj = {}
				filter.forEach(filterItem => {
					const [key, value, operator] = filterItem.split(':')
                    if (key === 'name') {
                        foundAtMostOneName += 1
                    }
					filterObj[key] = value
				})
				filters.push(filterObj)
			})
		}
	}
	return resp.json(proc.queryData({
		showRuntimeVersion: foundAtMostOneName === 1 ? true : false
	}, filters))
  })
};

// const createProxyMiddleware = require('http-proxy-middleware');

// module.exports = function(app) {
//   app.use(
//     '/v1',
//     createProxyMiddleware({
//       target: process.env.CRAWLER_API_URL,
//       changeOrigin: true,
//     })
//   );
// };