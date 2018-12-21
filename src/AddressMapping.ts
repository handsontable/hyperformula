import {SimpleCellAddress} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {CellVertex, EmptyCellVertex} from './Vertex'

/**
 * Mapping from cell addresses to vertices
 *
 * Uses Map to store addresses, having minimal memory usage for sparse sheets but not necessarily constant set/lookup.
 */
export class AddressMapping implements IAddressMapping {
  private mapping: Map<number, Map<number, CellVertex>> = new Map()

  constructor(private width: number = 0, private height: number = 0) { }

  /**
   * Returns cell content
   *
   * @param address - cell address
   */
  public getCell(address: SimpleCellAddress): CellVertex {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return colMapping.get(address.row) || EmptyCellVertex.getSingletonInstance()
  }

  /**
   * Set vertex for given address
   *
   * @param address - cell address
   * @param newVertex - vertex to associate with address
   */
  public setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    let colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      colMapping = new Map()
      this.mapping.set(address.col, colMapping)
    }
    colMapping.set(address.row, newVertex)
  }

  /**
   * Returns whether the address is present or not
   *
   * @param address - address
   */
  public has(address: SimpleCellAddress): boolean {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return false
    }
    return !!colMapping.get(address.row)
  }

  /**
   * Returns height of stored sheet
   */
  public getHeight(): number {
    return this.height
  }

  /**
   * Returns width of stored sheet
   */
  public getWidth(): number {
    return this.width
  }
}
