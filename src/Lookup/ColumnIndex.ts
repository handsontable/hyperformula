/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
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
import {SimpleRangeValue} from '../SimpleRangeValue'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {ColumnsSpan, RowsSpan} from '../Span'
import {Statistics, StatType} from '../statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {ColumnSearchStrategy, SearchOptions} from './SearchStrategy'
import {Maybe} from '../Maybe'
import {AbsoluteCellRange} from '../AbsoluteCellRange'

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
    this.binarySearchStrategy = new ColumnBinarySearch(dependencyGraph)
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

  /*
   * WARNING: Finding lower/upper bounds in unordered ranges is not supported. When ordering === 'none', assumes matchExactly === true
   */
  public find(searchKey: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, { ordering, matchExactly }: SearchOptions): number {
    const handlingDuplicates = matchExactly === true ? 'findFirst' : 'findLast'
    const resultUsingColumnIndex = this.findUsingColumnIndex(searchKey, rangeValue, handlingDuplicates)
    return resultUsingColumnIndex !== undefined ? resultUsingColumnIndex : this.binarySearchStrategy.find(searchKey, rangeValue, { ordering, matchExactly })
  }

  private findUsingColumnIndex(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, handlingDuplicates: 'findFirst' | 'findLast'): Maybe<number> {
    const range = rangeValue.range
    if (range === undefined) {
      return undefined
    }

    this.ensureRecentData(range.sheet, range.start.col, key)

    const columnMap = this.getColumnMap(range.sheet, range.start.col)
    if (!columnMap) {
      return -1
    }

    const normalizedKey = typeof key === 'string' ? forceNormalizeString(key) : key
    const valueIndexForTheKey = columnMap.get(normalizedKey)
    if (!valueIndexForTheKey || !valueIndexForTheKey.index || valueIndexForTheKey.index.length === 0) {
      return undefined
    }

    const rowNumber = ColumnIndex.findRowBelongingToRange(valueIndexForTheKey, range, handlingDuplicates)
    return rowNumber !== undefined ? rowNumber - range.start.row : undefined
  }

  private static findRowBelongingToRange(valueIndex: ValueIndex, range: AbsoluteCellRange, handlingDuplicates: 'findFirst' | 'findLast'): Maybe<number> {
    const start = range.start.row
    const end = range.end.row

    const positionInIndex = handlingDuplicates === 'findFirst'
      ? findInOrderedArray(start, valueIndex.index, 'upperBound')
      : findInOrderedArray(end, valueIndex.index, 'lowerBound')

    if (positionInIndex === -1) {
      return undefined
    }

    const rowNumber = valueIndex.index[positionInIndex]
    const isRowNumberBelongingToRange = rowNumber >= start && rowNumber <= end

    return isRowNumberBelongingToRange ? rowNumber : undefined
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
      ColumnIndex.addValue(valueIndex, address.row)
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

      const positionInIndex = findInOrderedArray(address.row, valueIndex.index)
      if (positionInIndex > -1) {
        valueIndex.index.splice(positionInIndex, 1)
      }

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
    ColumnIndex.shiftRows(valueIndex, rowsSpan.rowStart, rowsSpan.numberOfRows)
  }

  private removeRows(col: number, rowsSpan: RowsSpan, value: RawInterpreterValue) {
    const valueIndex = this.getValueIndex(rowsSpan.sheet, col, value)
    ColumnIndex.removeRowsFromValues(valueIndex, rowsSpan)
    ColumnIndex.shiftRows(valueIndex, rowsSpan.rowEnd + 1, -rowsSpan.numberOfRows)
  }

  private static addValue(valueIndex: ValueIndex, rowNumber: number): void {
    const rowIndex = findInOrderedArray(rowNumber, valueIndex.index, 'lowerBound')
    const isRowNumberAlreadyInIndex = valueIndex.index[rowIndex] === rowNumber

    if (!isRowNumberAlreadyInIndex) {
      valueIndex.index.splice(rowIndex + 1, 0, rowNumber)
    }
  }

  private static removeRowsFromValues(valueIndex: ValueIndex, rowsSpan: RowsSpan) {
    const start = findInOrderedArray(rowsSpan.rowStart, valueIndex.index, 'upperBound')
    const end = findInOrderedArray(rowsSpan.rowEnd, valueIndex.index, 'lowerBound')
    const isFoundSpanValid = start > -1 && end > -1 && start <= end && valueIndex.index[start] <= rowsSpan.rowEnd

    if (isFoundSpanValid) {
      valueIndex.index.splice(start, end - start + 1)
    }
  }

  private static shiftRows(valueIndex: ValueIndex, afterRow: number, numberOfRows: number) {
    const positionInIndex = findInOrderedArray(afterRow, valueIndex.index, 'upperBound')
    if (positionInIndex === -1) {
      return
    }

    for (let i = positionInIndex; i < valueIndex.index.length; ++i) {
      valueIndex.index[i] += numberOfRows
    }
  }
}

/*
 * Returns:
 * - index of the key, if the key exists in the array,
 * - index of the lower/upper bound (depending on handlingMisses parameter) otherwise.
 * Assumption: The array is ordered ascending and contains no repetitions.
 */
export function findInOrderedArray(key: number, values: number[], handlingMisses: 'lowerBound' | 'upperBound' = 'upperBound'): number {
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

  const foundIndex = handlingMisses === 'lowerBound' ? end : start
  const isIndexInRange = foundIndex >= 0 && foundIndex <= values.length
  return isIndexInRange ? foundIndex : -1
}
