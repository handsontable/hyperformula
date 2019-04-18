import {SheetCellAddress, CellValue, SimpleCellAddress} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {ArrayAddressMapping} from './ArrayAddressMapping'
import {Sheet, Sheets} from './GraphBuilder'
import {CellVertex, EmptyCellVertex, MatrixVertex, Vertex} from './Vertex'

/**
 * Mapping from cell addresses to vertices
 *
 * Uses Map to store addresses, having minimal memory usage for sparse sheets but not necessarily constant set/lookup.
 */
class SparseStrategy {
  /**
   * Map of Maps in which actual data is stored.
   *
   * Key of map in first level is column number.
   * Key of map in second level is row number.
   */
  private mapping: Map<number, Map<number, CellVertex>> = new Map()

  /** @inheritDoc */
  public getCell(address: SheetCellAddress): CellVertex {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return colMapping.get(address.row) || EmptyCellVertex.getSingletonInstance()
  }

  /** @inheritDoc */
  public setCell(address: SheetCellAddress, newVertex: CellVertex) {
    let colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      colMapping = new Map()
      this.mapping.set(address.col, colMapping)
    }
    colMapping.set(address.row, newVertex)
  }

  /** @inheritDoc */
  public has(address: SheetCellAddress): boolean {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return false
    }
    return !!colMapping.get(address.row)
  }

  /** @inheritDoc */
  public getHeight(): number {
    let currentMax = 0
    this.mapping.forEach((colMapping) => {
      currentMax = Math.max(currentMax, Math.max(...Array.from(colMapping.keys())) + 1)
    })
    return currentMax
  }

  /** @inheritDoc */
  public getWidth(): number {
    return Math.max(0, Math.max(...Array.from(this.mapping.keys())) + 1)
  }
}

/**
 * Returns actual width, height and fill ratio of a sheet
 *
 * @param sheet - two-dimmensional array sheet representation
 */
export function findBoundaries(sheet: Sheet): ({ width: number, height: number, fill: number }) {
  let maxWidth = 0
  let cellsCount = 0
  for (let currentRow = 0; currentRow < sheet.length; currentRow++) {
    const currentRowWidth = sheet[currentRow].length
    if (maxWidth === undefined || maxWidth < currentRowWidth) {
      maxWidth = currentRowWidth
    }
    for (let currentCol = 0; currentCol < currentRowWidth; currentCol++) {
      const currentValue = sheet[currentRow][currentCol]
      if (currentValue !== '') {
        cellsCount++
      }
    }
  }
  const sheetSize = sheet.length * maxWidth

  return {
    height: sheet.length,
    width: maxWidth,
    fill: sheetSize === 0 ? 0 : cellsCount / sheetSize,
  }
}

export class AddressMapping implements IAddressMapping {

  /**
   * Creates right address mapping implementation based on fill ratio of a sheet
   *
   * @param sheet - two-dimmensional array sheet representation
   */
  public static build(sheets: Sheets, threshold: number): IAddressMapping {
    if (Object.keys(sheets).length > 1) {
      return new AddressMapping()
    }
    const sheet = sheets.Sheet1
    const {height, width, fill} = findBoundaries(sheet)
    if (fill > threshold) {
      return new ArrayAddressMapping(width, height)
    } else {
      return new AddressMapping()
    }
  }

  private mapping: Map<number, SparseStrategy> = new Map()

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): CellVertex {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return sheetMapping.getCell(address)
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
      sheetMapping = new SparseStrategy()
      this.mapping.set(address.sheet, sheetMapping)
    }
    sheetMapping.setCell(address, newVertex)
  }

  /** @inheritDoc */
  public has(address: SimpleCellAddress): boolean {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      return false
    }
    return sheetMapping.has(address)
  }

  /** @inheritDoc */
  public getHeight(sheetId: number): number {
    return this.mapping.get(sheetId)!.getHeight()
  }

  /** @inheritDoc */
  public getWidth(sheetId: number): number {
    return this.mapping.get(sheetId)!.getWidth()
  }

  public isEmpty(address: SimpleCellAddress): boolean {
    return (this.getCell(address) instanceof EmptyCellVertex)
  }
}
