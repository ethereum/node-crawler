import { matchesFilter } from "./FilterRunner"

const client = {
  a: 'b',
  num: 12,
  c: {
    'd': 'cheetah',
    'e': 'cat',
    f: {
      g: {
        h: {
          k: 'dog'
        }
      }
    }
  }
}

test("simple filter types on root", () => {
  expect(matchesFilter(client, { num: 'gte 11'})).toBeTruthy()
})

test("simple filter types in nested", () => {
  expect(matchesFilter(client, { c: { d: 'cheetah'}})).toBeTruthy()
  expect(matchesFilter(client, { c: { e: 'cat'}})).toBeTruthy()
  expect(matchesFilter(client, { c: { f: { g: { h: { k: 'dog'}}}}})).toBeTruthy()
})

test("multiple levels filter types in nested", () => {
  expect(matchesFilter(client, { c: { e: 'cat', f: { g: { h: { k: 'dog'}}}}})).toBeTruthy()
})

test("filter not found", () => {
  expect(matchesFilter(client, { c: { d: 'chimp'}})).toBeFalsy()
  expect(matchesFilter(client, { c: { e: 'chimp', f: { g: { h: { k: 'dog'}}}}})).toBeFalsy()
})