/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SheetCellAddress, SimpleCellAddress} from '../../Cell'
import {Maybe} from '../../Maybe'
import {ColumnsSpan, RowsSpan} from '../../Span'
import {CellVertex} from '../Vertex'

export type AddressMappingStrategyConstructor = new (width: number, height: number) => IAddressMappingStrategy

/**
 * Interface for mapping from sheet addresses to vertices.
 */
export interface IAddressMappingStrategy {
  /**
   * Returns cell content
   *
   * @param address - cell address
   */
  getCell(address: SheetCellAddress): Maybe<CellVertex>,

  /**
   * Set vertex for given address
   *
   * @param address - cell address
   * @param newVertex - vertex to associate with address
   */
  setCell(address: SheetCellAddress, newVertex: CellVertex): void,

  removeCell(address: SimpleCellAddress): void,

  /**
   * Returns whether the address is present or not
   *
   * @param address - address
   */
  has(address: SheetCellAddress): boolean,

  /**
   * Returns height of stored sheet
   */
  getHeight(): number,

  /**
   * Returns width of stored sheet
   */
  getWidth(): number,

  addRows(row: number, numberOfRows: number): void,

  removeRows(removedRows: RowsSpan): void,

  addColumns(column: number, numberOfColumns: number): void,

  removeColumns(removedColumns: ColumnsSpan): void,

  getEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex]>,

  verticesFromColumn(column: number): IterableIterator<CellVertex>,

  verticesFromRow(row: number): IterableIterator<CellVertex>,

  verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex>,

  verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex>,

  entriesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<[SimpleCellAddress, CellVertex]>,

  entriesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<[SimpleCellAddress, CellVertex]>,

  vertices(): IterableIterator<CellVertex>,
}
