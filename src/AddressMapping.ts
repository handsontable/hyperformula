import {SheetCellAddress, CellValue, SimpleCellAddress} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {ArrayAddressMapping} from './ArrayAddressMapping'
import {Sheet, Sheets} from './GraphBuilder'
import {CellVertex, EmptyCellVertex, MatrixVertex, Vertex} from './Vertex'

/**
 * Interface for mapping from sheet addresses to vertices.
 */
interface IAddressMappingStrategy {
  /**
   * Returns cell content
   *
   * @param address - cell address
   */
  getCell(address: SheetCellAddress): CellVertex,

  /**
   * Set vertex for given address
   *
   * @param address - cell address
   * @param newVertex - vertex to associate with address
   */
  setCell(address: SheetCellAddress, newVertex: CellVertex): void,

  /**
   * Returns whether the address is present or not
   *
   * @param address - address
   */
  has(address: SheetCellAddress): boolean,

  /**
   * Returns height of stored sheet
   */
  getHeight(): number,

  /**
   * Returns width of stored sheet
   */
  getWidth(): number
}

/**
 * Mapping from cell addresses to vertices
 *
 * Uses Map to store addresses, having minimal memory usage for sparse sheets but not necessarily constant set/lookup.
 */
export class SparseStrategy implements IAddressMappingStrategy {
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
 * Mapping from cell addresses to vertices
 *
 * Uses Array to store addresses, having minimal memory usage for dense sheets and constant set/lookup.
 */
export class DenseStrategy implements IAddressMappingStrategy {
  /**
   * Array in which actual data is stored.
   *
   * It is created when building the mapping and the size of it is fixed.
   */
  private mapping: CellVertex[][]

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

  /** @inheritDoc */
  public getCell(address: SheetCellAddress): CellVertex {
    const row = this.mapping[address.row]
    if (!row) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return row[address.col] || EmptyCellVertex.getSingletonInstance()
  }

  /** @inheritDoc */
  public setCell(address: SheetCellAddress, newVertex: CellVertex) {
    this.mapping[address.row][address.col] = newVertex
  }

  /** @inheritDoc */
  public has(address: SheetCellAddress): boolean {
    const row = this.mapping[address.row]
    if (!row) {
      return false
    }
    return !!row[address.col]
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
  public static build(threshold: number): AddressMapping {
    return new AddressMapping(threshold)
  }

  private mapping: Map<number, IAddressMappingStrategy> = new Map()

  constructor(
    private readonly threshold: number
  ) { }

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): CellVertex {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return sheetMapping.getCell(address)
  }

  public strategyFor(sheetId: number): IAddressMappingStrategy | undefined {
    return this.mapping.get(sheetId)
  }

  public addSheet(sheetId: number, sheet: Sheet, strategy: String = 'auto') {
    if (this.mapping.has(sheetId)) {
      throw Error("Sheet already added")
    }

    if (strategy === 'auto') {
      const {height, width, fill} = findBoundaries(sheet)
      if (fill > this.threshold) {
        this.mapping.set(sheetId, new DenseStrategy(width, height))
      } else {
        this.mapping.set(sheetId, new SparseStrategy())
      }
    } else if (strategy === 'dense') {
      const {height, width, fill} = findBoundaries(sheet)
      this.mapping.set(sheetId, new DenseStrategy(width, height))
    } else if (strategy === 'sparse') {
      this.mapping.set(sheetId, new SparseStrategy())
    } else {
      throw Error('Unknown strategy')
    }
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
