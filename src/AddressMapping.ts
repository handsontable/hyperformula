import {CellValue, SheetCellAddress, SimpleCellAddress} from './Cell'
import {Sheet, Sheets} from './GraphBuilder'
import {CellVertex, EmptyCellVertex, MatrixVertex, Vertex} from './Vertex'
import {AbsoluteCellRange} from "./AbsoluteCellRange";	
import {Matrix} from "./Matrix";
import {Graph} from "./Graph"

export type SerializedMapping = DenseSerializedMapping | SparseSerializedMapping

interface SparseSerializedMapping {
  kind: "sparse",
  width: number,
  height: number,
  mapping: number[],
}

interface DenseSerializedMapping {
  kind: "dense",
  width: number,
  height: number,
  mapping: number[],
}

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
  getWidth(): number,

  getAllVertices(): Array<Vertex>,

  getSerialized(): SerializedMapping,
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

  public static fromSerialized(serializedMapping: SparseSerializedMapping, graph: Graph<Vertex>): SparseStrategy {
    const mapping = new SparseStrategy(serializedMapping.width, serializedMapping.height)
    const numberOfElements = serializedMapping.mapping.length / 3
    for (let i = 0; i < numberOfElements; i++) {
      mapping.setCell({ col: serializedMapping.mapping[3*i], row: serializedMapping.mapping[3*i + 1]}, graph.getNodeById(serializedMapping.mapping[3*i+2]) as CellVertex)
    }
    return mapping
  }

  constructor(private width: number, private height: number) {}

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
    return this.height
  }

  /** @inheritDoc */
  public getWidth(): number {
    return this.width
  }

  public getAllVertices(): Array<Vertex> {
    const vertices = new Set<Vertex>()
    this.mapping.forEach((rowVertices, column) => {
      rowVertices.forEach((vertex, row) => {
        vertices.add(vertex)
      })
    })
    return Array.from(vertices)
  }

  public getSerialized(): SparseSerializedMapping {
    const mapping: number[] = []
    this.mapping.forEach((rowVertices, column) => {
      rowVertices.forEach((vertex, row) => {
        mapping.push(column, row, vertex.id)
      })
    })
    return {
      kind: "sparse",
      width: this.width,
      height: this.height,
      mapping,
    }
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

  public static fromSerialized(serializedMapping: DenseSerializedMapping, graph: Graph<Vertex>): DenseStrategy {
    const mapping = new DenseStrategy(serializedMapping.width, serializedMapping.height)
    for (let row = 0; row < serializedMapping.height; row++) {
      for (let col = 0; col < serializedMapping.width; col++) {
        const id = serializedMapping.mapping[row * serializedMapping.width + col]
        if (id >= 0) {
          mapping.setCell({ col, row }, graph.getNodeById(id) as CellVertex)
        }
      }
    }
    return mapping
  }

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

  public getAllVertices(): Array<Vertex> {
    const vertices = new Set<Vertex>()
    for (const row of this.mapping) {
      for (const vertex of row) {
        if (vertex) {
          vertices.add(vertex)
        }
      }
    }
    return Array.from(vertices)
  }

  public getSerialized(): DenseSerializedMapping {
    const mapping: number[] = []
    for (const row of this.mapping) {
      for (const vertex of row) {
        if (vertex) {
          mapping.push(vertex.id)
        } else {
          mapping.push(-1)
        }
      }
    }
    return {
      kind: "dense",
      width: this.width,
      height: this.height,
      mapping,
    }
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

export class AddressMapping {
  /**
   * Creates right address mapping implementation based on fill ratio of a sheet
   *
   * @param sheet - two-dimmensional array sheet representation
   */
  public static build(threshold: number): AddressMapping {
    return new AddressMapping(threshold)
  }

  private mapping: Map<number, IAddressMappingStrategy> = new Map()

  private matrixMapping: Map<string, MatrixVertex> = new Map()

  constructor(
    private readonly threshold: number,
  ) { }

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): CellVertex {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return sheetMapping.getCell(address)
  }

  public strategyFor(sheetId: number): IAddressMappingStrategy {
    const strategy = this.mapping.get(sheetId)
    if (!strategy) {
      throw Error('Unknown sheet id')
    }

    return strategy
  }

  public addSheet(sheetId: number, strategy: IAddressMappingStrategy) {
    if (this.mapping.has(sheetId)) {
      throw Error('Sheet already added')
    }

    this.mapping.set(sheetId, strategy)
  }

  public autoAddSheet(sheetId: number, sheet: Sheet) {
    const {height, width, fill} = findBoundaries(sheet)
    let strategy
    if (fill > this.threshold) {
      strategy = new DenseStrategy(width, height)
    } else {
      strategy = new SparseStrategy(width, height)
    }
    this.addSheet(sheetId, strategy)
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
      throw Error("Sheet not initialized")
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

  public getMatrix(range: AbsoluteCellRange): MatrixVertex | undefined {
    return this.matrixMapping.get(range.toString())
  }

  public setMatrix(range: AbsoluteCellRange, vertex: MatrixVertex) {
    this.matrixMapping.set(range.toString(), vertex)
  }

  public getAllVerticesFromSheet(sheetId: number): Array<Vertex> {
    return this.mapping.get(sheetId)!.getAllVertices()
  }

  public getSerializedMapping(sheetId: number): SerializedMapping {
    return this.mapping.get(sheetId)!.getSerialized()
  }
}
