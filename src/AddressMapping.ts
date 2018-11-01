import { CellVertex } from "./Vertex"
import {SimpleCellAddress} from "./Cell";

export class AddressMapping {
  private mapping: Map<number, Map<number, CellVertex>> = new Map()

  getCell(address: SimpleCellAddress): CellVertex | null {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return null
    }
    return colMapping.get(address.row) || null
  }

  setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    let colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      colMapping = new Map()
      this.mapping.set(address.col, colMapping)
    }
    colMapping.set(address.row, newVertex)
  }

  has(address: SimpleCellAddress): boolean {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return false
    }
    return !!colMapping.get(address.row)
  }
}
