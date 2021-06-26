import { ClientsProcessor } from "./DataProcessor";

test("processes full schema correctly", () => {
  const peers = [
    { clientId: "Geth/v1.10.3-stable-991384a7/linux-amd64/go1.16.3", count: 2 },
    { clientId: "Geth/v1.10.4-stable/linux-amd64/go1.16.4", count: 1 },
    { clientId: "Geth/goerli/v1.10.4-unstable-966ee3ae-20210528/linux-amd64/go1.16.4", count: 1 },
    { clientId: "Geth/c30khkq4no1is608bj70/v1.10.4-stable-aa637fd3/linux-amd64/go1.16.5", count: 1 },
  ];
   
  const errorCallback = jest.fn()
  const processor = ClientsProcessor(peers, errorCallback)
  expect(processor).toHaveLength(peers.length)
  expect(errorCallback).not.toBeCalled()

  expect(processor[0]).toEqual({
    name: 'Geth',
    version: { 
      major: 1,
      minor: 10,
      patch: 3,
      tag: 'stable',
      build: '991384a7',
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
        patch: 3
      }
    }
  })

  expect(processor[1]).toEqual({
    name: 'Geth',
    version: { 
      major: 1,
      minor: 10,
      patch: 4,
      tag: 'stable'
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

  expect(processor[2]).toEqual({
    name: 'Geth',
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
  const peers = [
    { clientId: "besu/v21.7.0-RC1/linux-x86_64/corretto-java-11", count: 14 },
    { clientId: "erigon/v2021.06.5-alpha-a0694dd3/linux-amd64/go1.16.5", count: 1 },
    { clientId: "OpenEthereum/v3.2.6-stable-f9f4926-20210514/x86_64-linux-gnu/rustc1.52.1", count: 1 },
  ];
   
  const errorCallback = jest.fn()
  const processor = ClientsProcessor(peers, errorCallback)
  expect(processor).toHaveLength(peers.length)
  expect(errorCallback).not.toBeCalled()
  expect(processor.map(p => (p?.runtime))).toEqual([
    { name: 'java', version: { major: 11 } },
    { name: 'go', version: { major: 1, minor: 16, patch: 5 } },
    { name: 'rustc', version: { major: 1, minor: 52, patch: 1 } }
  ])
});

test("processes os correctly", () => {
  const peers = [
    { clientId: "besu/v21.7.0-RC1/linux-amd64/corretto-java-11", count: 14 },
    { clientId: "erigon/v2021.06.5-alpha-a0694dd3/windows/go1.16.5", count: 1 },
    { clientId: "OpenEthereum/v3.2.6-stable-f9f4926-20210514/x86_64-linux-gnu/rustc1.52.1", count: 1 },
  ];
   
  const errorCallback = jest.fn()
  const processor = ClientsProcessor(peers, errorCallback)
  expect(processor).toHaveLength(peers.length)
  expect(errorCallback).not.toBeCalled()
  console.log(processor.map(p => (p?.os)))
  expect(processor.map(p => (p?.os))).toEqual([
    { vendor: 'linux', architecture: 'amd64' },
    { vendor: 'windows' },
    { vendor: 'linux', architecture: 'x86_64' },
  ])
});

export {};
