import {SheetCellAddress, SimpleCellAddress} from '../../Cell'
import {ColumnsSpan} from '../../ColumnsSpan'
import {RowsSpan} from '../../RowsSpan'
import {CellVertex} from '../Vertex'

export type IAddressMappingStrategyConstructor = new (width: number, height: number) => IAddressMappingStrategy
/**
 * Interface for mapping from sheet addresses to vertices.
 */
export interface IAddressMappingStrategy {
  /**
   * Returns cell content
   *
   * @param address - cell address
   */
  getCell(address: SheetCellAddress): CellVertex | null,

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

  vertices(): IterableIterator<CellVertex>,
}
