import { ClientApiResponse, ClientsProcessor } from "./DataProcessor";

const mockPeers: ClientApiResponse[] = [
  { clientId: "Geth/v1.10.3-stable-991384a7/linux-amd64/go1.16.3", count: 5 },
  { clientId: "Geth/v1.10.4-stable/linux-x64/go1.16.4", count: 4 },
  { clientId: "Geth/goerli/v1.10.4-unstable-966ee3ae-20210528/linux-amd64/go1.16.4", count: 3 },
  { clientId: "besu/v21.7.0-RC1/darwin-x86_64/corretto-java-11", count: 2 },
  { clientId: "erigon/v2021.06.5-alpha-a0694dd3/windows-x86_64/go1.16.5", count: 1 },
  { clientId: "OpenEthereum/v3.2.6-stable-f9f4926-20210514/x86_64-linux-gnu/rustc1.52.1", count: 5 },
  { clientId: "Geth/v1.9.1-stable/linux-amd64/go1.15.1", count: 1 },
  { clientId: "Geth/v1.9.2-stable/windows-amd64/go1.15.1", count: 1 },
  { clientId: "Geth/v1.8.1-stable/darwin-amd64/go1.15.1", count: 1 },
];

function mockRaw() {
  const errorCallback = jest.fn()
  const processor = ClientsProcessor(mockPeers, errorCallback).getRaw()
  expect(processor).toHaveLength(mockPeers.length)
  expect(errorCallback).not.toBeCalled()
  return processor
}

function mockProcessor() {
  const errorCallback = jest.fn()
  const processor = ClientsProcessor(mockPeers, errorCallback)
  expect(errorCallback).not.toBeCalled()
  return processor
}

test("processes full schema correctly", () => {
  const raw = mockRaw()
  expect(raw[0]).toEqual({
    count: 5,
    primaryKey: 1,
    name: 'geth',
    version: { 
      major: 1,
      minor: 10,
      patch: 3,
      tag: 'stable',
      build: '991384a7',
    },
    os: {
      vendor: 'linux',
      architecture: 'amd64',
    },
    runtime: {
      name: 'go',
      version: { 
        major: 1,
        minor: 16,
        patch: 3
      }
    }
  })

  expect(raw[1]).toEqual({
    count: 4,
    primaryKey: 2,
    name: 'geth',
    version: { 
      major: 1,
      minor: 10,
      patch: 4,
      tag: 'stable'
    },
    os: {
      vendor: 'linux',
      architecture: 'x64'
    },
    runtime: {
      name: 'go',
      version: { 
        major: 1,
        minor: 16,
        patch: 4
      }
    }
  })

  expect(raw[2]).toEqual({
    count: 3,
    primaryKey: 3,
    name: 'geth',
    label: 'goerli',
    version: { 
      major: 1,
      minor: 10,
      patch: 4,
      tag: 'unstable',
      build: '966ee3ae',
      date: '20210528'
    },
    os: {
      vendor: 'linux',
      architecture: 'amd64'
    },
    runtime: {
      name: 'go',
      version: { 
        major: 1,
        minor: 16,
        patch: 4
      }
    }
  })
});

test("processes runtimes correctly", () => {
  const raw = mockRaw()
  expect(raw.map(p => (p?.runtime))).toEqual([
    { name: 'go', version: { major: 1, minor: 16, patch: 3 } },
    { name: 'go', version: { major: 1, minor: 16, patch: 4 } },
    { name: 'go', version: { major: 1, minor: 16, patch: 4 } },
    { name: 'java', version: { major: 11 } },
    { name: 'go', version: { major: 1, minor: 16, patch: 5 } },
    { name: 'rustc', version: { major: 1, minor: 52, patch: 1 } },
    { name: 'go', version: { major: 1, minor: 15, patch: 1 } },
    { name: 'go', version: { major: 1, minor: 15, patch: 1 } },
    { name: 'go', version: { major: 1, minor: 15, patch: 1 } },
  ])
});

test("processes os correctly", () => {
  const raw = mockRaw()
  expect(raw.map(p => (p?.os))).toEqual([
    { vendor: 'linux', architecture: 'amd64' },
    { vendor: 'linux', architecture: 'x64' },
    { vendor: 'linux', architecture: 'amd64' },
    { vendor: 'darwin', architecture: 'x86_64' },
    { vendor: 'windows', architecture: 'x86_64' },
    { vendor: 'linux', architecture: 'x86_64' },
    { vendor: 'linux', architecture: 'amd64' },
    { vendor: 'windows', architecture: 'amd64' },
    { vendor: 'darwin', architecture: 'amd64' },
  ])
});

test("top clients", () => {
  const processor = mockProcessor()
  expect(processor.queryData().clients).toEqual([
    { name: 'geth', count: 15 },
    { name: 'openethereum', count: 5 },
    { name: 'besu', count: 2 },
    { name: 'erigon', count: 1 }
  ])
})

test("top runtimes", () => {
  const processor = mockProcessor()
  expect(processor.queryData().languages).toEqual([
    { name: 'go', count: 16 },
    { name: 'rustc', count: 5 },
    { name: 'java', count: 2 }
  ])
})

test("top operating systmes", () => {
  const processor = mockProcessor()
  expect(processor.queryData().operatingSystems).toEqual([
    { name: 'linux', count: 18 },
    { name: 'darwin', count: 3 },
    { name: 'windows', count: 2 }
  ])
})

test("filtering with exact conditions", () => {
  const processor = mockProcessor()
  expect(processor.queryData({}, [{ os: {vendor: 'linux'}}]).clients).toEqual([
    { name: 'geth', count: 13 },
    { name: 'openethereum', count: 5 }
  ])

  expect(processor.queryData({}, [{ name: 'Geth'}]).clients).toEqual([
    { name: 'geth', count: 15 }
  ])

  expect(processor.queryData({}, [{ name: 'geth', version: {major: 1, minor: 10, patch: 4}}]).clients).toEqual([
    { name: 'geth', count: 7 }
  ])
})

test("filtering with conditionals", () => {
  const processor = mockProcessor()
  expect(processor.queryData({}, [{ name: 'Geth', version: {major: 1, minor: 'gte 10'}}]).clients).toEqual([
    { name: 'geth', count: 12 }
  ])

  expect(processor.queryData({}, [{ name: 'geth', version: {major: 1, minor: 'gte 8'}}]).clients).toEqual([
    { name: 'geth', count: 15 }
  ])
})

test("complex filtering with multiple filters and conditions", () => {
  const processor = mockProcessor()
  expect(processor.queryData({}, [
      { name: 'geth', version: {major: 1, minor: 'gte 9'}},
      { name: 'geth', version: {major: 1, minor: 'lt 10'}}
  ]).clients).toEqual([
    { name: 'geth', count: 2 }
  ])
})