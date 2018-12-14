import {SimpleCellAddress} from './Cell'
import {CellVertex, EmptyCellVertex, RangeVertex} from './Vertex'
import {IAddressMapping} from './IAddressMapping'

export class ArrayAddressMapping implements IAddressMapping {
  private mapping: Array<Array<CellVertex>>
  private rangeMapping: Map<string, RangeVertex> = new Map()

  constructor(private width: number, private height: number) {
    this.mapping = new Array(height)
    for (let i = 0; i < height; i++) {
      this.mapping[i] = new Array(width)
    }
  }

  public getCell(address: SimpleCellAddress): CellVertex {
    return this.mapping[address.row][address.col] || EmptyCellVertex.getSingletonInstance()
  }

  public setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    this.mapping[address.row][address.col] = newVertex
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
    return !!this.mapping[address.row][address.col]
  }

  public getHeight(): number {
    return this.height
  }

  public getWidth(): number {
    return this.width
  }
}
