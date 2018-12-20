import {SimpleCellAddress} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {CellVertex, EmptyCellVertex, RangeVertex} from './Vertex'

/**
 * Mapping from cell addresses to vertices and ranges to range vertices
 *
 * Uses Map to store addresses, having minimal memory usage for sparse sheets but not necessarily constant set/lookup.
 */
export class AddressMapping implements IAddressMapping {
  private mapping: Map<number, Map<number, CellVertex>> = new Map()
  private rangeMapping: Map<string, RangeVertex> = new Map()

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
   * Saves range vertex
   *
   * @param vertex - vertex to save
   */
  public setRange(vertex: RangeVertex) {
    const key = `${vertex.getStart().col},${vertex.getStart().row},${vertex.getEnd().col},${vertex.getEnd().row}`
    this.rangeMapping.set(key, vertex)
  }

  /**
   * Returns associated vertex for given range
   *
   * @param start - top-left corner of the range
   * @param end - bottom-right corner of the range
   */
  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex | null {
    const key = `${start.col},${start.row},${end.col},${end.row}`
    return this.rangeMapping.get(key) || null
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
