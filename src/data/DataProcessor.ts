import matchAll from 'string.prototype.matchall'
import { SortedMap } from './SortedMap';

export interface ClientApiResponse {
  clientId: string;
  count: number;
}

export interface Runtime {
  name?: string;
  version?: Version;
}

export interface Version {
  major: number;
  minor?: number;
  patch?: number;
  tag?: string;
  build?: string;
  date?: string;
}

export interface OperatingSytem {
  vendor: string;
  architecture: string;
}

export interface ClientDetail {
  label?: string;
  version?: Version;
  os?: OperatingSytem;
  runtime?: Runtime;
}

export interface Client extends ClientDetail {
  primaryKey: number;
  name: string;
  count: number;
}

export interface ClientDatabase {
  obj: {[key: number]: Client}
  getClients(): GetClientResponse[]
  getRaw(): Client[]
}

export interface GetClientResponse {
  name: string
  count: number
}

export interface LoadingResponse {
  status: 'loading'
}

interface ParseParam {
  raw: string
  primaryKey: number
  errorCallback: (entity: string, data: string, primaryKey: number) => void
}

const osMapping: { [key: string]: string } = {
  linux: "vendor",
  windows: "vendor",
  darwin: "vendor",
  x86_64: "architecture",
  x64: "architecture",
  amd64: "architecture"
};

function tryParseNumber(input: string): number | undefined  {
  return parseInt(input) || undefined
}

function parseVersion(version: string, parseOpt: ParseParam): Version | undefined {
  const matches = version.match(/v?(?<major>\d+)(?:.(?<minor>\d+).(?<patch>\d+)(?:-(?<tag>\w+)(?:-(?<build>[a-zA-Z0-9]+)(?:-(?<date>\d+))?)?)?)?/)
  
  if (!matches?.groups) {
    parseOpt.errorCallback('version', version, parseOpt.primaryKey);
    return undefined
  }

  const minor = tryParseNumber(matches.groups.minor)
  const patch = tryParseNumber(matches.groups.patch)
  const tag = matches.groups.tag
  const build = matches.groups.build
  const date = matches.groups.date

  return {
    major: parseInt(matches.groups.major),
    ...minor && { minor },
    ...patch && { patch },
    ...tag && { tag },
    ...build && { build },
    ...date && { date },
  }
}

function parseOs(os: string, parseOpt: ParseParam): OperatingSytem | undefined {
  const match = matchAll(os, /(linux|windows|darwin|x86_64|x64|amd64)/g)
  const matches = Array.from(match);

  if (matches.length) {
    const result: any = {};
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

function parseRuntime(runtime: string, parseOpt: ParseParam): Runtime | undefined {
  const matches = runtime.match(/(?<name>[a-zA-Z]+)?-?(?<version>[\d+.?]+)/);
  if (matches?.groups) {
    const name = matches.groups['name']
    const version = parseVersion(matches.groups['version'], parseOpt)
    return {
      ...name && { name },
      version
    }
  }

  parseOpt.errorCallback('runtime', runtime, parseOpt.primaryKey);
  return undefined;
}

function parseRaw(raw: string, parseOpt: ParseParam): ClientDetail | undefined {
  const tokenize = raw.split('/')
  let label: string | undefined
  let version: Version | undefined
  let os: OperatingSytem | undefined
  let runtime: Runtime | undefined
  
  if (tokenize.length === 5) {
    label = tokenize[1]
    version = parseVersion(tokenize[2], parseOpt)
    os = parseOs(tokenize[3], parseOpt)
    runtime = parseRuntime(tokenize[4], parseOpt)
  } else if (tokenize.length === 4) {
    version = parseVersion(tokenize[1], parseOpt)
    os = parseOs(tokenize[2], parseOpt)
    runtime = parseRuntime(tokenize[3], parseOpt)
  } else if (tokenize.length === 3) {
    version = parseVersion(tokenize[0], parseOpt)
    os = parseOs(tokenize[1], parseOpt)
    runtime = parseRuntime(tokenize[2], parseOpt)
  } else if (tokenize.length === 2) {
    os = parseOs(tokenize[0], parseOpt)
    runtime = parseRuntime(tokenize[1], parseOpt)
  }

  if (label || version || os || runtime) {
    return {
      ...label && { label },
      ...version && { version },
      ...os && { os },
      ...runtime && { runtime },
    };
  }

  parseOpt.errorCallback('raw', raw, parseOpt.primaryKey);
  return undefined;
}

export function ClientsProcessor(
  data: ClientApiResponse[],
  errorCallback: (entity: string, data: string, clientId: string) => void
): ClientDatabase {

  const obj: {[key: number]: Client} = {}

  let primaryKey = 0

  const parse = (item: ClientApiResponse): Client | undefined => {
    primaryKey++;
    if (!item.clientId) {
      errorCallback('parse', 'empty client id', '');
      return undefined;
    }

    const matches = item.clientId.match(/(?<name>\w+)\/(?<raw>.+)/);
    if (matches?.groups) {
      const rawString = item.clientId.toLowerCase()
      const raw = parseRaw(rawString, { primaryKey, errorCallback: (entity, data, pk) => {
        errorCallback(entity, data, `${pk}: "${rawString}"`)
      }, raw: rawString });
      if (!raw) {
        return undefined;
      }

      return {
        primaryKey,
        name: matches.groups.name,
        count: item.count,
        ...raw,
      };
    }

    errorCallback('parse', item.clientId, '');
    return undefined;
  };

  
  const getClients = (): GetClientResponse[] => {
    const clientCache = SortedMap<string, number>((a, b) => b[1] - a[1])
    
    for (let a in obj) {
      const client = obj[a]
      clientCache.set(client.name, (clientCache.get(client.name) || 0) + client.count)
    }

    return clientCache.map(a => ({
      name: a[0],
      count: a[1]
    }))
  }

  const getRaw = (): Client[] => {
    return Object.keys(obj).map(o => obj[parseInt(o)])
  }

  data.forEach((item) => {
    const parsedItem = parse(item)
    if (parsedItem) {
      obj[parsedItem.primaryKey] = parsedItem
    }
  })

  return {
    obj,
    getRaw,
    getClients
  }
}

export const EmptyDatabase: ClientDatabase = {
  obj: {},
  getClients: () => [],
  getRaw: () => []
}
