import {CellValue} from "../Cell";

/*
* If key exists returns index of key
* Otherwise returns index of smallest element greater than key
* assuming no repetitions
* */
export function upperBound(values: number[], key: number): number {
  let start = 0
  let end = values.length - 1

  while (start <= end) {
    let center = Math.floor((start + end) / 2)
    if (key > values[center]) {
      start = center + 1
    } else if (key < values[center]) {
      end = center - 1
    } else {
      return center
    }
  }

  return start
}


/*
* If key exists returns first index of key element in sorted array
* Otherwise returns first index of greatest element smaller than key
* */
export function lowerBound(values: CellValue[], key: any): number {
  let start = 0
  let end = values.length - 1

  while (start <= end) {
    let center = Math.floor((start + end) / 2)
    let cmp = compare(key, values[center])
    if (cmp > 0) {
      start = center + 1
    } else if (cmp < 0) {
      end = center - 1
    } else if (start != center) {
      end = center
    } else {
      return center
    }
  }

  return end
}

/*
* numbers < strings < false < true
* */
export function compare(left: any, right: any): number {
  if (typeof left === typeof right) {
    return (left < right ? -1 : (left > right ? 1 : 0))
  }
  if (typeof left === 'number' && typeof right === 'string') {
    return -1
  }
  if (typeof left === 'number' && typeof right === 'boolean') {
    return -1
  }
  if (typeof left === 'string' && typeof right === 'number') {
    return 1
  }
  if (typeof left === 'string' && typeof right === 'boolean') {
    return -1
  }
  return 1
}
