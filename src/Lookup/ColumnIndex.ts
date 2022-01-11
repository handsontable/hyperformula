/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, movedSimpleCellAddress, SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {CellValueChange} from '../ContentChanges'
import {DependencyGraph} from '../DependencyGraph'
import {AddRowsTransformer} from '../dependencyTransformers/AddRowsTransformer'
import {RemoveRowsTransformer} from '../dependencyTransformers/RemoveRowsTransformer'
import {FormulaTransformer} from '../dependencyTransformers/Transformer'
import {forceNormalizeString} from '../interpreter/ArithmeticHelper'
import {
  EmptyValue,
  getRawValue,
  RawInterpreterValue,
  RawNoErrorScalarValue,
  RawScalarValue
} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../interpreter/SimpleRangeValue'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {ColumnsSpan, RowsSpan} from '../Span'
import {Statistics, StatType} from '../statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {ColumnSearchStrategy} from './SearchStrategy'

type ColumnMap = Map<RawInterpreterValue, ValueIndex>

interface ValueIndex {
  version: number,
  index: number[],
}

type SheetIndex = ColumnMap[]

export class ColumnIndex implements ColumnSearchStrategy {

  private readonly index: Map<number, SheetIndex> = new Map()
  private readonly transformingService: LazilyTransformingAstService
  private readonly binarySearchStrategy: ColumnBinarySearch

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly config: Config,
    private readonly stats: Statistics,
  ) {
    this.transformingService = this.dependencyGraph.lazilyTransformingAstService
    this.binarySearchStrategy = new ColumnBinarySearch(dependencyGraph, config)
  }

  public add(value: RawInterpreterValue, address: SimpleCellAddress) {
    if (value === EmptyValue || value instanceof CellError) {
      return
    } else if (value instanceof SimpleRangeValue) {
      for (const [arrayValue, cellAddress] of value.entriesFromTopLeftCorner(address)) {
        this.addSingleCellValue(getRawValue(arrayValue), cellAddress)
      }
    } else {
      this.addSingleCellValue(value, address)
    }
  }

  public remove(value: RawInterpreterValue | undefined, address: SimpleCellAddress) {
    if (value === undefined) {
      return
    }

    if (value instanceof SimpleRangeValue) {
      for (const [arrayValue, cellAddress] of value.entriesFromTopLeftCorner(address)) {
        this.removeSingleValue(getRawValue(arrayValue), cellAddress)
      }
    } else {
      this.removeSingleValue(value, address)
    }
  }

  public change(oldValue: RawInterpreterValue | undefined, newValue: RawInterpreterValue, address: SimpleCellAddress) {
    if (oldValue === newValue) {
      return
    }
    this.remove(oldValue, address)
    this.add(newValue, address)
  }

  public applyChanges(contentChanges: CellValueChange[]) {
    for (const change of contentChanges) {
      if (change.oldValue !== undefined) {
        this.change(getRawValue(change.oldValue), getRawValue(change.value), change.address)
      }
    }
  }

  public moveValues(sourceRange: IterableIterator<[RawScalarValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number) {
    for (const [value, address] of sourceRange) {
      const targetAddress = movedSimpleCellAddress(address, toSheet, toRight, toBottom)
      this.remove(value, address)
      this.add(value, targetAddress)
    }
  }

  public removeValues(range: IterableIterator<[RawScalarValue, SimpleCellAddress]>): void {
    for (const [value, address] of range) {
      this.remove(value, address)
    }
  }

  public find(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, sorted: boolean): number {
    const range = rangeValue.range
    if (range === undefined) {
      return this.binarySearchStrategy.find(key, rangeValue, sorted)
    }
    this.ensureRecentData(range.sheet, range.start.col, key)

    const columnMap = this.getColumnMap(range.sheet, range.start.col)
    if (!columnMap) {
      return -1
    }

    if (typeof key === 'string') {
      key = forceNormalizeString(key)
    }

    const valueIndex = columnMap.get(key)
    if (!valueIndex) {
      return this.binarySearchStrategy.find(key, rangeValue, sorted)
    }

    const index = upperBound(valueIndex.index, range.start.row)
    const rowNumber = valueIndex.index[index]
    return rowNumber <= range.end.row ? rowNumber - range.start.row : this.binarySearchStrategy.find(key, rangeValue, sorted)
  }

  public advancedFind(keyMatcher: (arg: RawInterpreterValue) => boolean, range: SimpleRangeValue): number {
    return this.binarySearchStrategy.advancedFind(keyMatcher, range)
  }

  public addColumns(columnsSpan: ColumnsSpan) {
    const sheetIndex = this.index.get(columnsSpan.sheet)
    if (!sheetIndex) {
      return
    }

    sheetIndex.splice(columnsSpan.columnStart, 0, ...Array(columnsSpan.numberOfColumns))
  }

  public removeColumns(columnsSpan: ColumnsSpan) {
    const sheetIndex = this.index.get(columnsSpan.sheet)
    if (!sheetIndex) {
      return
    }

    sheetIndex.splice(columnsSpan.columnStart, columnsSpan.numberOfColumns)
  }

  public removeSheet(sheetId: number): void {
    this.index.delete(sheetId)
  }

  public getColumnMap(sheet: number, col: number): ColumnMap {
    if (!this.index.has(sheet)) {
      this.index.set(sheet, [])
    }
    const sheetMap = this.index.get(sheet)! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    let columnMap = sheetMap[col]

    if (!columnMap) {
      columnMap = new Map()
      sheetMap[col] = columnMap
    }

    return columnMap
  }

  public getValueIndex(sheet: number, col: number, value: RawInterpreterValue): ValueIndex {
    const columnMap = this.getColumnMap(sheet, col)
    let index = this.getColumnMap(sheet, col).get(value)
    if (!index) {
      index = {
        version: this.transformingService.version(),
        index: [],
      }
      columnMap.set(value, index)
    }
    return index
  }

  public ensureRecentData(sheet: number, col: number, value: RawInterpreterValue) {
    const valueIndex = this.getValueIndex(sheet, col, value)
    const actualVersion = this.transformingService.version()
    if (valueIndex.version === actualVersion) {
      return
    }
    const relevantTransformations = this.transformingService.getTransformationsFrom(valueIndex.version, (transformation: FormulaTransformer) => {
      return transformation.sheet === sheet && (transformation instanceof AddRowsTransformer || transformation instanceof RemoveRowsTransformer)
    })
    for (const transformation of relevantTransformations) {
      if (transformation instanceof AddRowsTransformer) {
        this.addRows(col, transformation.rowsSpan, value)
      } else if (transformation instanceof RemoveRowsTransformer) {
        this.removeRows(col, transformation.rowsSpan, value)
      }
    }
    valueIndex.version = actualVersion
  }

  private addSingleCellValue(value: RawInterpreterValue, address: SimpleCellAddress) {
    this.stats.measure(StatType.BUILD_COLUMN_INDEX, () => {
      this.ensureRecentData(address.sheet, address.col, value)
      if (typeof value === 'string') {
        value = forceNormalizeString(value)
      }
      const valueIndex = this.getValueIndex(address.sheet, address.col, value)
      this.addValue(valueIndex, address.row)
    })
  }

  private removeSingleValue(value: RawInterpreterValue, address: SimpleCellAddress) {
    this.stats.measure(StatType.BUILD_COLUMN_INDEX, () => {
      this.ensureRecentData(address.sheet, address.col, value)

      const columnMap = this.getColumnMap(address.sheet, address.col)
      if (typeof value === 'string') {
        value = forceNormalizeString(value)
      }
      const valueIndex = columnMap.get(value)
      if (!valueIndex) {
        return
      }

      const index = upperBound(valueIndex.index, address.row)
      valueIndex.index.splice(index, 1)

      if (valueIndex.index.length === 0) {
        columnMap.delete(value)
      }

      if (columnMap.size === 0) {
        delete this.index.get(address.sheet)![address.col] // eslint-disable-line @typescript-eslint/no-non-null-assertion
      }
    })
  }

  private addRows(col: number, rowsSpan: RowsSpan, value: RawInterpreterValue) {
    const valueIndex = this.getValueIndex(rowsSpan.sheet, col, value)
    this.shiftRows(valueIndex, rowsSpan.rowStart, rowsSpan.numberOfRows)
  }

  private removeRows(col: number, rowsSpan: RowsSpan, value: RawInterpreterValue) {
    const valueIndex = this.getValueIndex(rowsSpan.sheet, col, value)
    this.removeRowsFromValues(valueIndex, rowsSpan)
    this.shiftRows(valueIndex, rowsSpan.rowEnd + 1, -rowsSpan.numberOfRows)
  }

  private addValue(valueIndex: ValueIndex, rowNumber: number): void {
    const rowIndex = lowerBound(valueIndex.index, rowNumber)
    const value = valueIndex.index[rowIndex]
    if (value === rowNumber) {
      /* do not add same row twice */
      return
    }

    if (rowIndex === valueIndex.index.length - 1) {
      valueIndex.index.push(rowNumber)
    } else {
      valueIndex.index.splice(rowIndex + 1, 0, rowNumber)
    }
  }

  private removeRowsFromValues(rows: ValueIndex, rowsSpan: RowsSpan) {
    const start = upperBound(rows.index, rowsSpan.rowStart)
    const end = lowerBound(rows.index, rowsSpan.rowEnd)
    if (rows.index[start] <= rowsSpan.rowEnd) {
      rows.index.splice(start, end - start + 1)
    }
  }

  private shiftRows(rows: ValueIndex, afterRow: number, numberOfRows: number) {
    const index = upperBound(rows.index, afterRow)
    for (let i = index; i < rows.index.length; ++i) {
      rows.index[i] += numberOfRows
    }
  }
}

/*
* If key exists returns index of key
* Otherwise returns index of smallest element greater than key
* assuming sorted array and no repetitions
* */
export function upperBound(values: number[], key: number): number {
  let start = 0
  let end = values.length - 1

  while (start <= end) {
    const center = Math.floor((start + end) / 2)
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
* If key exists returns index of key
* Otherwise returns index of greatest element smaller than key
* assuming sorted array and no repetitions
* */
export function lowerBound(values: number[], key: number): number {
  let start = 0
  let end = values.length - 1

  while (start <= end) {
    const center = Math.floor((start + end) / 2)
    if (key > values[center]) {
      start = center + 1
    } else if (key < values[center]) {
      end = center - 1
    } else {
      return center
    }
  }

  return end
}
