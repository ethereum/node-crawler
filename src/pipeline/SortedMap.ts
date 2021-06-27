interface ISortedMap<K, V> {
  clear(): void;
  delete(key: K): boolean;
  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): Map<K, V>;
  size(): number;
  map: (callbackfn: (value: [K, V], index: number, array: [K, V][]) => any, thisArg?: any) => any[];
  iterator: Map<K, V>
}

export function SortedMap<K, V>(comparator: (a: [K, V], b: [K, V]) => number): ISortedMap<K, V> {
  const obj = new Map<K, V>();
  obj[Symbol.iterator] = function* () {
    yield* [...this.entries()].sort(comparator);
  };
  return {
    size: () => obj.size,
    clear: () => obj.clear(),
    delete: (key: K) => obj.delete(key),
    forEach: (callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) => obj.forEach(callbackfn, thisArg),
    get: (key: K) => obj.get(key),
    has: (key: K) => obj.has(key),
    set: (key: K, value: V) => obj.set(key, value),
    map: (callbackfn: (value: [K, V], index: number, array: [K, V][]) => any, thisArg?: any) => {
      return [...obj].map(callbackfn, thisArg)
    },
    iterator: obj
  }
}
