import {CellValue, SimpleCellAddress} from "./Cell";
import {AbsoluteCellRange} from "./AbsoluteCellRange";
import {binarySearch as lowerBound} from "./interpreter/binarySearch";
import {Statistics, StatType} from "./statistics/Statistics";

type ValueIndex = Array<number>
type SheetIndex = Array<Map<CellValue, ValueIndex>>

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

  public getColumnMap(sheet: number, col: number) {
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

  private addValue(valueIndex: ValueIndex, rowNumber: number) {
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
