import {SimpleCellAddress} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {Vertex, CellVertex, EmptyCellVertex} from './Vertex'
import {Graph} from './Graph'

/**
 * Mapping from cell addresses to vertices
 *
 * Uses Array to store addresses, having minimal memory usage for dense sheets and constant set/lookup.
 */
export class SimpleArrayAddressMapping implements IAddressMapping {
  /**
   * Array in which actual data is stored.
   *
   * It is created when building the mapping and the size of it is fixed.
   */

  public mapping: Int32Array

  /**
   * @param width - width of the stored sheet
   * @param height - height of the stored sheet
   */
  constructor(private width: number, private height: number, private graph: Graph<Vertex>, mapping?: Int32Array) {
    this.mapping = mapping || new Int32Array(width * height)
  }

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): CellVertex {
    const vertexId = this.mapping[address.row * this.width + address.col]
    if (vertexId === 0) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return this.graph.getNodeById(vertexId) as CellVertex
  }

  /** @inheritDoc */
  public setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    this.mapping[address.row * this.width + address.col] = newVertex.vertexId
  }

  /** @inheritDoc */
  public has(address: SimpleCellAddress): boolean {
    const vertexId = this.mapping[address.row * this.width + address.col]
    return !(vertexId === 0);
  }

  /** @inheritDoc */
  public getHeight(): number {
    return this.height
  }

  /** @inheritDoc */
  public getWidth(): number {
    return this.width
  }
}

