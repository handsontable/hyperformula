import {CellValue, SimpleCellAddress} from './Cell'
import {CellVertex} from './Vertex'

/**
 * Interface for mapping from addresses to vertices.
 */
export interface IAddressMapping {
  /**
   * Returns cell content
   *
   * @param address - cell address
    */
  getCell(address: SimpleCellAddress): CellVertex,

  /**
   * Set vertex for given address
   *
   * @param address - cell address
   * @param newVertex - vertex to associate with address
   */
  setCell(address: SimpleCellAddress, newVertex: CellVertex): void,

  /**
   * Returns whether the address is present or not
   *
   * @param address - address
   */
  has(address: SimpleCellAddress): boolean,

  /**
   * Returns height of stored sheet
   */
  getHeight(): number,

  /**
   * Returns width of stored sheet
   */
  getWidth(): number,


  getCellValue(address: SimpleCellAddress): Promise<CellValue>

  contextColor: number,

  getRemoteCellValueByVertex(address: SimpleCellAddress): Promise<CellValue>
}
