/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, simpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {EmptyValue, getRawValue, RawInterpreterValue, RawScalarValue} from './InterpreterValue'

/*
* If key exists returns first index of key element in range of sorted values
* Otherwise returns first index of greatest element smaller than key
* assuming sorted values in range
* */
export function rangeLowerBound(range: AbsoluteCellRange, key: RawScalarValue, dependencyGraph: DependencyGraph, coordinate: 'row' | 'col'): number {
  let end
  if(coordinate === 'col') {
    end = range.effectiveEndColumn(dependencyGraph)
  } else {
    end = range.effectiveEndRow(dependencyGraph)
  }
  const start = range.start[coordinate]

  let centerValueFn
  if (coordinate === 'row') {
    centerValueFn = (center: number) =>  getRawValue(dependencyGraph.getCellValue(simpleCellAddress(range.sheet, range.start.col, center)))
  } else {
    centerValueFn = (center: number) =>  getRawValue(dependencyGraph.getCellValue(simpleCellAddress(range.sheet, center, range.start.row)))
  }

  return lowerBound(centerValueFn, key, start, end)
}

/*
* If key exists returns first index of key element
* Otherwise returns first index of greatest element smaller than key
* assuming sorted values
* */
export function lowerBound(value: (index: number) => RawInterpreterValue, key: RawScalarValue, start: number, end: number): number {
  while (start <= end) {
    const center = Math.floor((start + end) / 2)
    const cmp = compare(key, value(center))
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
export function compare(left: RawScalarValue, right: RawInterpreterValue): number {
  if (typeof left === typeof right) {
    if(left === EmptyValue || left instanceof CellError) {
      return 0
    }
    return (left < (right as string | number | boolean) ? -1 : (left > (right as string | number | boolean) ? 1 : 0))
  }
  if(left === EmptyValue) {
    return -1
  }
  if(right === EmptyValue) {
    return 1
  }
  if(left instanceof CellError) {
    return 1
  }
  if(right instanceof CellError) {
    return -1
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
