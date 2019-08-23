import {CellValue} from "../Cell";

export function binarySearch(values: CellValue[], key: any): number {
  let start = 0
  let end = values.length - 1

  while (start <= end) {
    let center = Math.floor((start + end) / 2)
    let cmp = compare(key, values[center])
    if (cmp > 0) {
      start = center + 1
    } else if (cmp < 0) {
      end = center - 1
    } else {
      return center
    }
  }

  if (start >= values.length) {
    return values.length - 1
  }

  return -1
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
