import {IAddressMappingStrategy} from './AddressMapping'
import {CellValue, EmptyValue, SheetCellAddress, SimpleCellAddress, simpleCellAddress} from '../Cell'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {Sheet} from '../GraphBuilder'
import {CellVertex} from './Vertex'
import {PlusTree} from '../PlusTree'
import {RowsSpan} from '../RowsSpan'
import {ColumnsSpan} from '../ColumnsSpan'

export class PlusStrategy implements IAddressMappingStrategy {
  private mapping: PlusTree<Array<CellVertex>> = PlusTree.empty(64)

  constructor(private width: number, private height: number) {
  }

  /** @inheritDoc */
  public getCell(address: SheetCellAddress): CellVertex | null {
    const rowMapping = this.mapping.getKey(address.row)
    if (!rowMapping) {
      return null
    }
    return rowMapping[address.col] || null
  }

  /** @inheritDoc */
  public setCell(address: SheetCellAddress, newVertex: CellVertex) {
    this.width = Math.max(this.width, address.col + 1)
    this.height = Math.max(this.height, address.row + 1)

    let rowMapping = this.mapping.getKey(address.row)
    if (rowMapping === null) {
      rowMapping = []
      this.mapping.addKeyWithoutShift(address.row, rowMapping)
    }
    rowMapping[address.col] = newVertex
  }

  /** @inheritDoc */
  public has(address: SheetCellAddress): boolean {
    const rowMapping = this.mapping.getKey(address.row)
    if (!rowMapping) {
      return false
    }
    return !!rowMapping[address.col]
  }

  /** @inheritDoc */
  public getHeight(): number {
    return this.height
  }

  /** @inheritDoc */
  public getWidth(): number {
    return this.width
  }

  public removeCell(address: SimpleCellAddress): void {
    const rowMapping = this.mapping.getKey(address.row)
    if (rowMapping) {
      delete rowMapping[address.col]
    }
  }

  public addRows(row: number, numberOfRows: number): void {
    for (let i = 0; i < numberOfRows; i++) {
      this.mapping.addKeyWithShift(row, [])
    }
    this.height += numberOfRows
  }

  public addColumns(column: number, numberOfColumns: number): void {
    for (const row of this.mapping.values()) {
      if (row.length >= column) {
        row.splice(column, 0, ...new Array(numberOfColumns))
      }
    }
    this.width += numberOfColumns
  }

  public removeRows(removedRows: RowsSpan): void {
    for (let i = 0; i < removedRows.numberOfRows; i++) {
      this.mapping.deleteKeyWithShift(removedRows.rowStart)
    }
    const rightmostRowRemoved = Math.min(this.height - 1, removedRows.rowEnd)
    const numberOfRowsRemoved = Math.max(0, rightmostRowRemoved - removedRows.rowStart + 1)
    this.height = Math.max(0, this.height - numberOfRowsRemoved)
  }

  public removeColumns(removedColumns: ColumnsSpan): void {
    for (const row of this.mapping.values()) {
      row.splice(removedColumns.columnStart, removedColumns.numberOfColumns)
    }
    const rightmostColumnRemoved = Math.min(this.width - 1, removedColumns.columnEnd)
    const numberOfColumnsRemoved = Math.max(0, rightmostColumnRemoved - removedColumns.columnStart + 1)
    this.width = Math.max(0, this.width - numberOfColumnsRemoved)
  }

  public* getEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    for (const [rowNumber, row] of this.mapping.entries()) {
      for (let i = 0; i < row.length; i++) {
        yield [simpleCellAddress(sheet, i, rowNumber), row[i]]
      }
    }
  }

  public* verticesFromColumn(column: number): IterableIterator<CellVertex> {
    for (const row of this.mapping.values()) {
      if (row[column]) {
        yield row[column]
      }
    }
  }

  public* verticesFromRow(row: number): IterableIterator<CellVertex> {
    const rowMapping = this.mapping.getKey(row)
    if (rowMapping) {
      for (let i = 0; i < rowMapping.length; i++) {
        if (rowMapping[i]) {
          yield rowMapping[i]
        }
      }
    }
  }

  public* verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex> {
    for (const row of this.mapping.values()) {
      for (const column of columnsSpan.columns()) {
        if (row[column]) {
          yield row[column]
        }
      }
    }
  }

  public* verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex> {
    for (const [rowNumber, row] of this.mapping.entriesFromKeyRange(rowsSpan.rowStart, rowsSpan.rowEnd)) {
      yield* row[Symbol.iterator]()
    }
  }
}
