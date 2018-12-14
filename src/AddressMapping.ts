import {SimpleCellAddress} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {CellVertex, EmptyCellVertex, RangeVertex} from './Vertex'

export class AddressMapping implements IAddressMapping {
  private mapping: Map<number, Map<number, CellVertex>> = new Map()
  private rangeMapping: Map<string, RangeVertex> = new Map()

  constructor(private width: number = 0, private height: number = 0) { }

  public getCell(address: SimpleCellAddress): CellVertex {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return colMapping.get(address.row) || EmptyCellVertex.getSingletonInstance()
  }

  public setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    let colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      colMapping = new Map()
      this.mapping.set(address.col, colMapping)
    }
    colMapping.set(address.row, newVertex)
  }

  public setRange(vertex: RangeVertex) {
    const key = `${vertex.getStart().col},${vertex.getStart().row},${vertex.getEnd().col},${vertex.getEnd().row}`
    this.rangeMapping.set(key, vertex)
  }

  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex | null {
    const key = `${start.col},${start.row},${end.col},${end.row}`
    return this.rangeMapping.get(key) || null
  }

  public has(address: SimpleCellAddress): boolean {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return false
    }
    return !!colMapping.get(address.row)
  }

  public getHeight(): number {
    return this.height
  }

  public getWidth(): number {
    return this.width
  }
}
