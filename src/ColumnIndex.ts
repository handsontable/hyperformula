import {CellValue, SimpleCellAddress} from "./Cell";
import {AbsoluteCellRange} from "./AbsoluteCellRange";
import {Statistics, StatType} from "./statistics/Statistics";
import {RowsSpan} from "./RowsSpan";
import {ColumnsSpan} from "./ColumnsSpan";

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

    const index = upperBound(valueIndex, address.row)
    valueIndex.splice(index, 1)

    if (valueIndex.length === 0) {
      columnMap.delete(value)
    }

    if (columnMap.size === 0) {
      delete this.index.get(address.sheet)![address.col]
    }
  }

  public change(oldValue: CellValue | null, newValue: CellValue, address: SimpleCellAddress) {
    if (oldValue === newValue) {
      return
    }
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
    const index = upperBound(valueIndex, range.start.row)
    const rowNumber = valueIndex[index]
    return rowNumber <= range.end.row ? rowNumber : -1
  }

  public addRows(rowsSpan: RowsSpan) {
    const sheetIndex = this.index.get(rowsSpan.sheet)
    if (!sheetIndex) {
      return
    }

    this.shiftRows(sheetIndex, rowsSpan.rowStart, rowsSpan.numberOfRows)
  }

  public removeRows(rowsSpan: RowsSpan) {
    const sheetIndex = this.index.get(rowsSpan.sheet)
    if (!sheetIndex) {
      return
    }

    this.removeRowsFromValues(sheetIndex, rowsSpan)
    this.shiftRows(sheetIndex, rowsSpan.rowEnd + 1, -rowsSpan.numberOfRows)
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
      return []
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

  private removeRowsFromValues(sheetIndex: SheetIndex, rowsSpan: RowsSpan) {
    sheetIndex.forEach(column => {
      for (const rows of column.values()) {
        const start = upperBound(rows, rowsSpan.rowStart)
        const end = lowerBound(rows, rowsSpan.rowEnd)
        if (rows[start] <= rowsSpan.rowEnd) {
          rows.splice(start, end - start + 1)
        }
      }
    })
  }

  private shiftRows(sheetIndex: SheetIndex, afterRow: number, numberOfRows: number) {
    sheetIndex.forEach(column => {
      for (const rows of column.values()) {
        const index = upperBound(rows, afterRow)
        for (let i=index; i<rows.length; ++i) {
          rows[i] += numberOfRows
        }
      }
    })
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
* If key exists returns index of key
* Otherwise returns index of greatest element smaller than key
* assuming sorted array and no repetitions
* */
export function lowerBound(values: number[], key: number): number {
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

  return end
}
