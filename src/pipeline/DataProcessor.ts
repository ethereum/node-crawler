import matchAll from 'string.prototype.matchall'

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

export function ClientsProcessor(
  data: ClientApiResponse[],
  errorCallback: (error: string) => void
) {
  const parseDetail = (
    clientId: string,
    detail: string
  ): ClientDetail | undefined => {
    const mapping: { [key: string]: string } = {
      linux: "vendor",
      windows: "vendor",
      darwin: "vendor",
      x86: "architecture",
      x64: "architecture",
      amd64: "architecture"
    };

    const tryParseNumber = (input: string): number | undefined => parseInt(input) || undefined

    const parseVersion = (version: string): Version | undefined => {
      const matches = version.match(/v?(?<major>\d+)(?:.(?<minor>\d+).(?<patch>\d+)(?:-(?<tag>\w+)(?:-(?<build>[a-zA-Z0-9]+)(?:-(?<date>\d+))?)?)?)?/)
      
      if (!matches?.groups) {
        errorCallback(`'Invalid Version: "${version}", for id: "${clientId}"`);
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
    };

    const parseOs = (os: string): OperatingSytem | undefined => {
      const match = matchAll(os, /(linux|windows|darwin|x86|x64|amd64)/g)
      let matches = Array.from(match);

      if (matches.length) {
        let result: any = {};
        matches.forEach((match) => {
          const value = match[1];
          const key = mapping[value];
          result[key] = value;
        });

        return result;
      }

      errorCallback(`'Invalid OS: "${os}", for id: "${clientId}"`);
      return undefined;
    };

    const parseRuntime = (runtime: string): Runtime | undefined => {
      
      let matches = runtime.match(/(?<name>[a-zA-Z]+)?-?(?<version>[\d+.?]+)/);
      if (matches?.groups) {
        let name = matches.groups['name']
        let version = parseVersion(matches.groups['version'])
        return {
          ...name && { name },
          version
        }
      }

      errorCallback(`'Invalid Runtime: "${runtime}", for id: "${clientId}"`);
      return undefined;
    };

    const tokenize = detail.toLowerCase().split('/')
    let label: string | undefined
    let version: Version | undefined
    let os: OperatingSytem | undefined
    let runtime: Runtime | undefined

    if (tokenize.length === 4) {
      label = tokenize[0]
      version = parseVersion(tokenize[1])
      os = parseOs(tokenize[2])
      runtime = parseRuntime(tokenize[3])
    } else if (tokenize.length === 3) {
      version = parseVersion(tokenize[0])
      os = parseOs(tokenize[1])
      runtime = parseRuntime(tokenize[2])
    } else if (tokenize.length === 2) {
      os = parseOs(tokenize[0])
      runtime = parseRuntime(tokenize[1])
    }

    if (label || version || os || runtime) {
      return {
        ...label && { label },
        ...version && { version },
        ...os && { os },
        ...runtime && { runtime },
      };
    }

    errorCallback(`'Invalid Detail: "${detail}", for id: "${clientId}"`);
    return undefined;
  };

  const parseClient = (item: ClientApiResponse) => {
    const matches = item.clientId.match(/(\w+)\/(.+)/);
    if (matches) {
      const rest = parseDetail(item.clientId, matches[2]);
      if (!rest) {
        return undefined;
      }

      return {
        id: matches[1],
        ...rest,
      };
    }

    errorCallback(`'Invalid ClientId: "${item.clientId}"`);
    return undefined;
  };

  return data.map((item) => parseClient(item));
}
