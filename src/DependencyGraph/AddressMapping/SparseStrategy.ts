import {CellVertex} from "../Vertex";
import {SheetCellAddress, simpleCellAddress, SimpleCellAddress} from "../../Cell";
import {RowsSpan} from "../../RowsSpan";
import {ColumnsSpan} from "../../ColumnsSpan";
import {IAddressMappingStrategy} from "./IAddressMappingStrategy";

/**
 * Mapping from cell addresses to vertices
 *
 * Uses Map to store addresses, having minimal memory usage for sparse sheets but not necessarily constant set/lookup.
 */
export class SparseStrategy implements IAddressMappingStrategy {
  /**
   * Map of Maps in which actual data is stored.
   *
   * Key of map in first level is column number.
   * Key of map in second level is row number.
   */
  private mapping: Map<number, Map<number, CellVertex>> = new Map()

  constructor(private width: number, private height: number) {
  }

  /** @inheritDoc */
  public getCell(address: SheetCellAddress): CellVertex | null {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return null
    }
    return colMapping.get(address.row) || null
  }

  /** @inheritDoc */
  public setCell(address: SheetCellAddress, newVertex: CellVertex) {
    this.width = Math.max(this.width, address.col + 1)
    this.height = Math.max(this.height, address.row + 1)

    let colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      colMapping = new Map()
      this.mapping.set(address.col, colMapping)
    }
    colMapping.set(address.row, newVertex)
  }

  /** @inheritDoc */
  public has(address: SheetCellAddress): boolean {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return false
    }
    return !!colMapping.get(address.row)
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
    const colMapping = this.mapping.get(address.col)
    if (colMapping) {
      colMapping.delete(address.row)
    }
  }

  public addRows(row: number, numberOfRows: number): void {
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      const tmpMapping = new Map()
      rowMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        if (rowNumber >= row) {
          tmpMapping.set(rowNumber + numberOfRows, vertex)
          rowMapping.delete(rowNumber)
        }
      })
      tmpMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        rowMapping.set(rowNumber, vertex)
      })
    })
    this.height += numberOfRows
  }

  public addColumns(column: number, numberOfColumns: number): void {
    const tmpMapping = new Map()
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      if (colNumber >= column) {
        tmpMapping.set(colNumber + numberOfColumns, rowMapping)
        this.mapping.delete(colNumber)
      }
    })
    tmpMapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      this.mapping.set(colNumber, rowMapping)
    })
    this.width += numberOfColumns
  }

  public removeRows(removedRows: RowsSpan): void {
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      const tmpMapping = new Map()
      rowMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        if (rowNumber >= removedRows.rowStart) {
          rowMapping.delete(rowNumber)
          if (rowNumber > removedRows.rowEnd) {
            tmpMapping.set(rowNumber - removedRows.numberOfRows, vertex)
          }
        }
      })
      tmpMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        rowMapping.set(rowNumber, vertex)
      })
    })
    const rightmostRowRemoved = Math.min(this.height - 1, removedRows.rowEnd)
    const numberOfRowsRemoved = Math.max(0, rightmostRowRemoved - removedRows.rowStart + 1)
    this.height = Math.max(0, this.height - numberOfRowsRemoved)
  }

  public removeColumns(removedColumns: ColumnsSpan): void {
    const tmpMapping = new Map()
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      if (colNumber >= removedColumns.columnStart) {
        this.mapping.delete(colNumber)
        if (colNumber > removedColumns.columnEnd) {
          tmpMapping.set(colNumber - removedColumns.numberOfColumns, rowMapping)
        }
      }
    })
    tmpMapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      this.mapping.set(colNumber, rowMapping)
    })
    const rightmostColumnRemoved = Math.min(this.width - 1, removedColumns.columnEnd)
    const numberOfColumnsRemoved = Math.max(0, rightmostColumnRemoved - removedColumns.columnStart + 1)
    this.width = Math.max(0, this.width - numberOfColumnsRemoved)
  }

  public* getEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    for (const [colNumber, col] of this.mapping) {
      for (const [rowNumber, value] of col) {
        yield [simpleCellAddress(sheet, colNumber, rowNumber), value]
      }
    }
  }

  public* verticesFromColumn(column: number): IterableIterator<CellVertex> {
    const colMapping = this.mapping.get(column)
    if (!colMapping) {
      return
    }
    for (const [_, vertex] of colMapping) {
      yield vertex
    }
  }

  public* verticesFromRow(row: number): IterableIterator<CellVertex> {
    for (const colMapping of this.mapping.values()) {
      const rowVertex = colMapping.get(row)
      if (rowVertex) {
        yield rowVertex
      }
    }
  }

  public* verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex> {
    for (const column of columnsSpan.columns()) {
      const colMapping = this.mapping.get(column)
      if (!colMapping) {
        continue
      }
      for (const [_, vertex] of colMapping) {
        yield vertex
      }
    }
  }

  public* verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex> {
    for (const colMapping of this.mapping.values()) {
      for (const row of rowsSpan.rows()) {
        const rowVertex = colMapping.get(row)
        if (rowVertex) {
          yield rowVertex
        }
      }
    }
  }

  public* vertices(): IterableIterator<CellVertex> {
    for (const [_, col] of this.mapping) {
      for (const [_, value] of col) {
        if (value) {
          yield value
        }
      }
    }
  }
}
