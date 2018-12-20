import {SimpleCellAddress} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {CellVertex, EmptyCellVertex, RangeVertex} from './Vertex'

/**
 * Mapping from cell addresses to vertices and ranges to range vertices
 *
 * Uses Array to store addresses, having minimal memory usage for dense sheets and constant set/lookup.
  */
export class ArrayAddressMapping implements IAddressMapping {
  private mapping: CellVertex[][]
  private rangeMapping: Map<string, RangeVertex> = new Map()

  /**
   * @param width - width of the stored sheet
   * @param height - height of the stored sheet
   */
  constructor(private width: number, private height: number) {
    this.mapping = new Array(height)
    for (let i = 0; i < height; i++) {
      this.mapping[i] = new Array(width)
    }
  }

  /**
   * Returns cell content
   *
   * @param address - cell address
    */
  public getCell(address: SimpleCellAddress): CellVertex {
    const row = this.mapping[address.row]
    if (!row) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return row[address.col] || EmptyCellVertex.getSingletonInstance()
  }

  /**
   * Set vertex for given address
   *
   * @param address - cell address
   * @param newVertex - vertex to associate with address
    */
  public setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    this.mapping[address.row][address.col] = newVertex
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
    const row = this.mapping[address.row]
    if (!row) {
      return false
    }
    return !!row[address.col]
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
