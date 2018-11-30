import {SimpleCellAddress} from './Cell'
import {CellVertex, EmptyCellVertex, RangeVertex} from './Vertex'

export class AddressMapping {
  private mapping: Map<number, Map<number, CellVertex>> = new Map()
  private rangeMapping: Map<string, RangeVertex> = new Map()

  constructor(private maxCol: number = 0, private maxRow: number = 0) { }

  public getCell(address: SimpleCellAddress): CellVertex | null {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return null
    }
    return colMapping.get(address.row) || null
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

  public getMaximumRow(): number {
    return this.maxRow
  }

  public getMaximumCol(): number {
    return this.maxCol
  }
}
