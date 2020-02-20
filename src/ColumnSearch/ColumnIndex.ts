import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, InternalCellValue, movedSimpleCellAddress, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {LazilyTransformingAstService, Transformation, TransformationType} from '../LazilyTransformingAstService'
import {Matrix} from '../Matrix'
import {RowsSpan} from '../RowsSpan'
import {Statistics, StatType} from '../statistics/Statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {IColumnSearchStrategy} from './ColumnSearchStrategy'

type ColumnMap = Map<InternalCellValue, ValueIndex>

interface ValueIndex {
  version: number,
  index: number[],
}

type SheetIndex = ColumnMap[]

export class ColumnIndex implements IColumnSearchStrategy {

  public static buildEmpty(transformingService: LazilyTransformingAstService, config: Config, statistics: Statistics) {
    const dependencyGraph = DependencyGraph.buildEmpty(transformingService, config, statistics)
    return new ColumnIndex(dependencyGraph, config, statistics)
  }
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

  public add(value: InternalCellValue | Matrix, address: SimpleCellAddress) {
    if (value instanceof Matrix) {
      for (const [matrixValue, cellAddress] of value.generateValues(address)) {
        this.addSingleCellValue(matrixValue, cellAddress)
      }
    } else if (!(value instanceof CellError)) {
      this.addSingleCellValue(value, address)
    }
  }

  public remove(value: InternalCellValue | Matrix | null, address: SimpleCellAddress) {
    if (!value) {
      return
    }

    if (value instanceof Matrix) {
      for (const [matrixValue, cellAddress] of value.generateValues(address)) {
        this.removeSingleValue(matrixValue, cellAddress)
      }
    } else {
      this.removeSingleValue(value, address)
    }
  }

  public change(oldValue: InternalCellValue | Matrix | null, newValue: InternalCellValue | Matrix, address: SimpleCellAddress) {
    if (oldValue === newValue) {
      return
    }
    this.remove(oldValue, address)
    this.add(newValue, address)
  }

  public moveValues(sourceRange: IterableIterator<[InternalCellValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number) {
    for (const [value, address] of sourceRange) {
      const targetAddress = movedSimpleCellAddress(address, toSheet, toRight, toBottom)
      this.remove(value, address)
      this.add(value, targetAddress)
    }
  }

  public removeValues(range: IterableIterator<[InternalCellValue, SimpleCellAddress]>): void {
    for (const [value, address] of range) {
      this.remove(value, address)
    }
  }

  public find(key: any, range: AbsoluteCellRange, sorted: boolean): number {
    this.ensureRecentData(range.sheet, range.start.col, key)

    const columnMap = this.getColumnMap(range.sheet, range.start.col)
    if (!columnMap) {
      return -1
    }

    const valueIndex = columnMap.get(key)
    if (!valueIndex) {
      return this.binarySearchStrategy.find(key, range, sorted)
    }

    const index = upperBound(valueIndex.index, range.start.row)
    const rowNumber = valueIndex.index[index]
    return rowNumber <= range.end.row ? rowNumber : this.binarySearchStrategy.find(key, range, sorted)
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
    const sheetMap = this.index.get(sheet)!
    let columnMap = sheetMap[col]

    if (!columnMap) {
      columnMap = new Map()
      sheetMap[col] = columnMap
    }

    return columnMap
  }

  public getValueIndex(sheet: number, col: number, value: InternalCellValue): ValueIndex {
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

  public ensureRecentData(sheet: number, col: number, value: InternalCellValue) {
    const valueIndex = this.getValueIndex(sheet, col, value)
    const actualVersion = this.transformingService.version()
    if (valueIndex.version === actualVersion) {
      return
    }
    const relevantTransformations = this.transformingService.getTransformationsFrom(valueIndex.version, (transformation: Transformation) => {
      return transformation.sheet === sheet && (transformation.type === TransformationType.ADD_ROWS || transformation.type === TransformationType.REMOVE_ROWS)
    })
    for (const transformation of relevantTransformations) {
      switch (transformation.type) {
        case TransformationType.ADD_ROWS:
          this.addRows(col, transformation.addedRows, value)
          break
        case TransformationType.REMOVE_ROWS:
          this.removeRows(col, transformation.removedRows, value)
      }
    }
    valueIndex.version = actualVersion
  }

  public destroy() {
    this.index.clear()
  }

  private addSingleCellValue(value: InternalCellValue, address: SimpleCellAddress) {
    this.stats.measure(StatType.BUILD_COLUMN_INDEX, () => {
      this.ensureRecentData(address.sheet, address.col, value)
      const valueIndex = this.getValueIndex(address.sheet, address.col, value)
      this.addValue(valueIndex, address.row)
    })
  }

  private removeSingleValue(value: InternalCellValue, address: SimpleCellAddress) {
    this.stats.measure(StatType.BUILD_COLUMN_INDEX, () => {
      this.ensureRecentData(address.sheet, address.col, value)

      const columnMap = this.getColumnMap(address.sheet, address.col)
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
        delete this.index.get(address.sheet)![address.col]
      }
    })
  }

  private addRows(col: number, rowsSpan: RowsSpan, value: InternalCellValue) {
    const valueIndex = this.getValueIndex(rowsSpan.sheet, col, value)
    this.shiftRows(valueIndex, rowsSpan.rowStart, rowsSpan.numberOfRows)
  }

  private removeRows(col: number, rowsSpan: RowsSpan, value: InternalCellValue) {
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
