import {CellValue, SimpleCellAddress} from "./Cell";

export class ColumnIndex {
  private readonly index: Array<Map<CellValue, Array<number>>>

  constructor(
      private width: number,
      private height: number,
      private sheet: number
  ) {
    this.index = new Array(width)
  }

  public buildIndex(values: IterableIterator<[CellValue, SimpleCellAddress]>) {
      for (const [value, address] of values) {
        this.addToIndex(value, address)
      }
  }

  public addToIndex(value: CellValue, address: SimpleCellAddress) {
    let columnMap = this.index[address.col]
    if (!columnMap) {
      columnMap = new Map()
      this.index[address.col] = columnMap
    }
    let valueIndex = columnMap.get(value)
    if (!valueIndex) {
      valueIndex = []
      columnMap.set(value, valueIndex)
    }
    valueIndex.push(address.row)
  }

  public find(key: any, column: number, startRow: number, endRow: number): number {
    const columnMap = this.index[column]
    if (!columnMap) {
      return -1
    }

    const valueIndex = columnMap.get(key)
    if (!valueIndex) {
      return -1
    }

    /* assuming that valueIndex is sorted already */
    const index = binarySearch(valueIndex, startRow)
    const rowNumber = valueIndex[index]
    return rowNumber <= endRow ? rowNumber : -1
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
