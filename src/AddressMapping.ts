import {CellValue, SimpleCellAddress} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {CellVertex, EmptyCellVertex, MatrixVertex, Vertex} from './Vertex'

/**
 * Mapping from cell addresses to vertices
 *
 * Uses Map to store addresses, having minimal memory usage for sparse sheets but not necessarily constant set/lookup.
 */
export class AddressMapping implements IAddressMapping {
  /**
   * Map of Maps in which actual data is stored.
   *
   * Key of map in first level is column number.
   * Key of map in second level is row number.
   */
  private mapping: Map<number, Map<number, Map<number, CellVertex>>> = new Map()

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): CellVertex {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      return EmptyCellVertex.getSingletonInstance()
    }
    const colMapping = sheetMapping.get(address.col)
    if (!colMapping) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return colMapping.get(address.row) || EmptyCellVertex.getSingletonInstance()
  }

  public getCellValue(address: SimpleCellAddress): CellValue {
    const vertex = this.getCell(address)

    if (vertex instanceof MatrixVertex) {
      return vertex.getMatrixCellValue(address)
    } else {
      return vertex.getCellValue()
    }
  }

  /** @inheritDoc */
  public setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    let sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      sheetMapping = new Map()
      this.mapping.set(address.sheet, sheetMapping)
    }
    let colMapping = sheetMapping.get(address.col)
    if (!colMapping) {
      colMapping = new Map()
      sheetMapping.set(address.col, colMapping)
    }
    colMapping.set(address.row, newVertex)
  }

  /** @inheritDoc */
  public has(address: SimpleCellAddress): boolean {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      return false
    }
    const colMapping = sheetMapping.get(address.col)
    if (!colMapping) {
      return false
    }
    return !!colMapping.get(address.row)
  }

  /** @inheritDoc */
  public getHeight(sheetId: number): number {
    let currentMax = 0
    this.mapping.get(sheetId)!.forEach((colMapping) => {
      currentMax = Math.max(currentMax, Math.max(...Array.from(colMapping.keys())) + 1)
    })
    return currentMax
  }

  /** @inheritDoc */
  public getWidth(sheetId: number): number {
    return Math.max(0, Math.max(...Array.from(this.mapping.get(sheetId)!.keys())) + 1)
  }

  public isEmpty(address: SimpleCellAddress): boolean {
    return (this.getCell(address) instanceof EmptyCellVertex)
  }
}
