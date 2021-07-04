interface NamedCount {
	name: string;
	count: number;
}

export function appendOtherGroup(list: NamedCount[]): NamedCount[] {
  if (list.length <= 10){
    return list;
  }
  
  const newList = list.slice(0, 10)
  const others = list.slice(10).reduce((prev, curr) => {
    return prev + curr.count
  }, 0)
  newList.push({name: 'others', count: others})
  return newList
}