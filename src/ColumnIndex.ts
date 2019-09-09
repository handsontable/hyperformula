import {CellValue, SimpleCellAddress} from "./Cell";
import {AbsoluteCellRange} from "./AbsoluteCellRange";
import {binarySearch as lowerBound} from "./interpreter/binarySearch";
import {Statistics, StatType} from "./statistics/Statistics";
import {RowsSpan} from "./RowsSpan";

type ValueIndex = Array<number>
type ColumnMap = Map<CellValue, ValueIndex>
type SheetIndex = Array<ColumnMap>

export class ColumnIndex {
  private readonly index: Map<number, SheetIndex> = new Map()

  constructor(private readonly stats: Statistics) {}

  public add(value: CellValue, address: SimpleCellAddress) {
    this.stats.measure(StatType.BUILD_COLUMN_INDEX, () => {
      const columnMap = this.getColumnMap(address.sheet, address.col)
      let valueIndex = columnMap.get(value)
      if (!valueIndex) {
        valueIndex = []
        columnMap.set(value, valueIndex)
      }
      this.addValue(valueIndex, address.row)
    })
  }

  public remove(value: CellValue | null, address: SimpleCellAddress) {
    if (!value) {
      return
    }

    const columnMap = this.getColumnMap(address.sheet, address.col)
    let valueIndex = columnMap.get(value)
    if (!valueIndex) {
      return
    }

    const index = binarySearch(valueIndex, address.row)
    valueIndex.splice(index, 1)

    if (valueIndex.length === 0) {
      columnMap.delete(value)
    }

    if (columnMap.size === 0) {
      delete this.index.get(address.sheet)![address.col]
    }
  }

  public change(oldValue: CellValue | null, newValue: CellValue, address: SimpleCellAddress) {
    this.remove(oldValue, address)
    this.add(newValue, address)
  }

  public find(key: any, range: AbsoluteCellRange): number {
    const columnMap = this.getColumnMap(range.sheet, range.start.col)
    if (!columnMap) {
      return -1
    }

    const valueIndex = columnMap.get(key)
    if (!valueIndex) {
      return -1
    }

    /* assuming that valueIndex is sorted already */
    const index = binarySearch(valueIndex, range.start.row)
    const rowNumber = valueIndex[index]
    return rowNumber <= range.end.row ? rowNumber : -1
  }

  public getColumnMap(sheet: number, col: number): ColumnMap {
    if (!this.index.has(sheet)) {
      this.index.set(sheet, [])
    }
    let sheetMap = this.index.get(sheet)!
    let columnMap = sheetMap![col]

    if (!columnMap) {
      columnMap = new Map()
      sheetMap[col] = columnMap
    }

    return columnMap
  }

  public getValueIndex(sheet: number, col: number, value: CellValue): ValueIndex {
    const index = this.getColumnMap(sheet, col).get(value)
    if (!index) {
      throw Error()
    }
    return index
  }

  private addValue(valueIndex: ValueIndex, rowNumber: number): void {
    const index = lowerBound(valueIndex, rowNumber)
    const value = valueIndex[index]
    if (value === rowNumber) {
      /* do not add same row twice */
      return
    }

    if (index === valueIndex.length - 1) {
      valueIndex.push(rowNumber)
    } else {
      valueIndex.splice(index + 1, 0, rowNumber)
    }
  }

  public addRows(rowsSpan: RowsSpan) {
    const sheetIndex = this.index.get(rowsSpan.sheet)
    if (!sheetIndex) {
      return
    }

    sheetIndex.forEach(column => {
      for (const rows of column.values()) {
        const index = lowerBound(rows, rowsSpan.rowStart)
        for (let i=index; i<rows.length; ++i) {
          rows[i] += rowsSpan.numberOfRows
        }
      }
    })
  }
}

export function binarySearch(values: number[], key: number): number {
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
