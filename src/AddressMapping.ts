import { CellVertex } from "./Vertex"
import {CellAddress} from "./Cell";

export class AddressMapping {
  private mapping: Map<number, Map<number, CellVertex>> = new Map()
  private reversedMapping: Map<CellVertex, CellAddress> = new Map()

  constructor() {
  }

  getCell(address: CellAddress): CellVertex | null {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return null
    }
    return colMapping.get(address.row) || null
  }

  getAddress(vertex: CellVertex): CellAddress | null {
    const address = this.reversedMapping.get(vertex)
    if (!address) {
      return null
    }
    return address
  }

  setCell(address: CellAddress, newVertex: CellVertex) {
    let colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      colMapping = new Map()
      this.mapping.set(address.col, colMapping)
    }
    colMapping.set(address.row, newVertex)
    this.reversedMapping.set(newVertex, address)
  }

  has(address: CellAddress): boolean {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return false
    }
    return !!colMapping.get(address.row)
  }
}
