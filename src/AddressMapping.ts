import { CellVertex } from "./Vertex"
import {CellAddress} from "./Cell";

export class AddressMapping {
  private mapping: Map<number, Map<number, CellVertex>> = new Map()

  getCell(address: CellAddress): CellVertex | null {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return null
    }
    return colMapping.get(address.row) || null
  }

  setCell(address: CellAddress, newVertex: CellVertex) {
    let colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      colMapping = new Map()
      this.mapping.set(address.col, colMapping)
    }
    colMapping.set(address.row, newVertex)
  }

  has(address: CellAddress): boolean {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return false
    }
    return !!colMapping.get(address.row)
  }
}
