import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellValue, EmptyValue, SheetCellAddress, SimpleCellAddress, simpleCellAddress} from '../Cell'
import {Sheet} from '../GraphBuilder'
import {MatrixVertex} from './'
import {CellVertex} from './Vertex'
import {ColumnsSpan} from '../ColumnsSpan'

/**
 * Interface for mapping from sheet addresses to vertices.
 */
interface IAddressMappingStrategy {
  /**
   * Returns cell content
   *
   * @param address - cell address
   */
  getCell(address: SheetCellAddress): CellVertex | null,

  /**
   * Set vertex for given address
   *
   * @param address - cell address
   * @param newVertex - vertex to associate with address
   */
  setCell(address: SheetCellAddress, newVertex: CellVertex): void,

  removeCell(address: SimpleCellAddress): void

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

  addRows(row: number, numberOfRows: number): void,
  removeRows(rowStart: number, rowEnd: number): void,
  addColumns(column: number, numberOfColumns: number): void,
  removeColumns(columnsSpan: ColumnsSpan): void,
  getEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex | null]>,
  verticesFromColumn(column: number): IterableIterator<CellVertex>,
  verticesFromRow(row: number): IterableIterator<CellVertex>,
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

  constructor(private width: number, private height: number) {
  }

  /** @inheritDoc */
  public getCell(address: SheetCellAddress): CellVertex | null {
    const colMapping = this.mapping.get(address.col)
    if (!colMapping) {
      return null
    }
    return colMapping.get(address.row) || null
  }

  /** @inheritDoc */
  public setCell(address: SheetCellAddress, newVertex: CellVertex) {
    this.width = Math.max(this.width, address.col + 1)
    this.height = Math.max(this.height, address.row + 1)

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

  public removeCell(address: SimpleCellAddress): void {
    const colMapping = this.mapping.get(address.col)
    if (colMapping) {
      colMapping.delete(address.row)
    }
  }

  public addRows(row: number, numberOfRows: number): void {
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      const tmpMapping = new Map()
      rowMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        if (rowNumber >= row) {
          tmpMapping.set(rowNumber + numberOfRows, vertex)
          rowMapping.delete(rowNumber)
        }
      })
      tmpMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        rowMapping.set(rowNumber, vertex)
      })
    })
    this.height += numberOfRows
  }

  public addColumns(column: number, numberOfColumns: number): void {
    const tmpMapping = new Map()
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      if (colNumber >= column) {
        tmpMapping.set(colNumber + numberOfColumns, rowMapping)
        this.mapping.delete(colNumber)
      }
    })
    tmpMapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      this.mapping.set(colNumber, rowMapping)
    })
    this.width += numberOfColumns
  }

  public removeRows(rowStart: number, rowEnd: number): void {
    const numberOfRows = rowEnd - rowStart + 1
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      const tmpMapping = new Map()
      rowMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        if (rowNumber >= rowStart) {
          rowMapping.delete(rowNumber)
          if (rowNumber > rowEnd) {
            tmpMapping.set(rowNumber - numberOfRows, vertex)
          }
        }
      })
      tmpMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        rowMapping.set(rowNumber, vertex)
      })
    })
    this.height = Math.max(0, this.height - numberOfRows)
  }

  public removeColumns(columnsSpan: ColumnsSpan): void {
    const tmpMapping = new Map()
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      if (colNumber >= columnsSpan.columnStart) {
        this.mapping.delete(colNumber)
        if (colNumber > columnsSpan.columnEnd) {
          tmpMapping.set(colNumber - columnsSpan.numberOfColumns, rowMapping)
        }
      }
    })
    tmpMapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      this.mapping.set(colNumber, rowMapping)
    })
    this.width = Math.max(0, this.width - columnsSpan.numberOfColumns)
  }

  public* getEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    for (const [colNumber, col] of this.mapping) {
      for (const [rowNumber, value] of col) {
        yield [simpleCellAddress(sheet, colNumber, rowNumber), value]
      }
    }
  }

  public* verticesFromColumn(column: number): IterableIterator<CellVertex> {
    const colMapping = this.mapping.get(column)
    if (!colMapping) {
      return
    }
    for (const [rowNumber, vertex] of colMapping) {
      yield vertex
    }
  }

  public* verticesFromRow(row: number): IterableIterator<CellVertex> {
    for (const colMapping of this.mapping.values()) {
      const rowVertex = colMapping.get(row)
      if (rowVertex) {
        yield rowVertex
      }
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
  private readonly mapping: CellVertex[][]

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
  public getCell(address: SheetCellAddress): CellVertex | null {
    const row = this.mapping[address.row]
    if (!row) {
      return null
    }
    return row[address.col] || null
  }

  /** @inheritDoc */
  public setCell(address: SheetCellAddress, newVertex: CellVertex) {
    this.width = Math.max(this.width, address.col + 1)
    this.height = Math.max(this.height, address.row + 1)

    const rowMapping = this.mapping[address.row]
    if (!rowMapping) {
      this.mapping[address.row] = new Array(this.width)
    }
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

  public removeCell(address: SimpleCellAddress): void {
    if (this.mapping[address.row] !== undefined) {
      delete this.mapping[address.row][address.col]
    }
  }

  public addRows(row: number, numberOfRows: number): void {
    const newRows = []
    for (let i = 0; i < numberOfRows; i++) {
      newRows.push(new Array(this.width))
    }
    this.mapping.splice(row, 0, ...newRows)
    this.height += numberOfRows
  }

  public addColumns(column: number, numberOfColumns: number): void {
    for (let i = 0; i < this.height; i++) {
      this.mapping[i].splice(column, 0, ...new Array(numberOfColumns))
    }
    this.width += numberOfColumns
  }

  public removeRows(rowStart: number, rowEnd: number): void {
    const numberOfRows = rowEnd - rowStart + 1
    this.mapping.splice(rowStart, numberOfRows)
    this.height = Math.max(0, this.height - numberOfRows)
  }

  public removeColumns(columnsSpan: ColumnsSpan): void {
    for (let i = 0; i < this.height; i++) {
      this.mapping[i].splice(columnsSpan.columnStart, columnsSpan.numberOfColumns)
    }
    this.width = Math.max(0, this.width - columnsSpan.numberOfColumns)
  }

  public* getEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        yield [simpleCellAddress(sheet, x, y), this.mapping[y][x]]
      }
    }
  }

  public* verticesFromColumn(column: number): IterableIterator<CellVertex> {
    for (let y = 0; y < this.height; ++y) {
      const vertex = this.mapping[y][column]
      if (vertex) {
        yield vertex
      }
    }
  }

  public* verticesFromRow(row: number): IterableIterator<CellVertex> {
    for (let x = 0; x < this.width; ++x) {
      const vertex = this.mapping[row][x]
      if (vertex) {
        yield vertex
      }
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

  constructor(
      private readonly threshold: number,
  ) {
  }

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): CellVertex | null {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      throw Error('Unknown sheet id')
    }
    return sheetMapping.getCell(address)
  }

  public fetchCell(address: SimpleCellAddress): CellVertex {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      throw Error('Unknown sheet id')
    }
    const vertex = sheetMapping.getCell(address)
    if (!vertex) {
      throw Error('Vertex for address missing in AddressMapping')
    }
    return vertex
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

    if (vertex === null) {
      return EmptyValue
    } else if (vertex instanceof MatrixVertex) {
      return vertex.getMatrixCellValue(address)
    } else {
      return vertex.getCellValue()
    }
  }

  /** @inheritDoc */
  public setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      throw Error('Sheet not initialized')
    }
    sheetMapping.setCell(address, newVertex)
  }

  public removeCell(address: SimpleCellAddress) {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      throw Error('Sheet not initialized')
    }
    sheetMapping.removeCell(address)
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
    const sheetMapping = this.mapping.get(sheetId)
    if (!sheetMapping) {
      throw Error('Sheet does not exist')
    }
    return sheetMapping.getHeight()
  }

  /** @inheritDoc */
  public getWidth(sheetId: number): number {
    const sheetMapping = this.mapping.get(sheetId)
    if (!sheetMapping) {
      throw Error('Sheet does not exist')
    }
    return sheetMapping.getWidth()
  }

  public addRows(sheet: number, row: number, numberOfRows: number) {
    const sheetMapping = this.mapping.get(sheet)
    if (!sheetMapping) {
      throw Error('Sheet does not exist')
    }
    sheetMapping.addRows(row, numberOfRows)
  }

  public removeRows(sheet: number, rowStart: number, rowEnd: number) {
    const sheetMapping = this.mapping.get(sheet)
    if (!sheetMapping) {
      throw Error('Sheet does not exist')
    }
    sheetMapping.removeRows(rowStart, rowEnd)
  }

  public addColumns(sheet: number, column: number, numberOfColumns: number) {
    const sheetMapping = this.mapping.get(sheet)
    if (!sheetMapping) {
      throw Error('Sheet does not exist')
    }
    sheetMapping.addColumns(column, numberOfColumns)
  }

  public removeColumns(columnsSpan: ColumnsSpan) {
    const sheetMapping = this.mapping.get(columnsSpan.sheet)
    if (!sheetMapping) {
      throw Error('Sheet does not exist')
    }
    sheetMapping.removeColumns(columnsSpan)
  }

  public* verticesFromRange(range: AbsoluteCellRange): IterableIterator<CellVertex> {
    for (const address of range.addresses()) {
      const vertex = this.getCell(address)
      if (vertex) {
        yield vertex
      }
    }
  }

  public* valuesFromRange(range: AbsoluteCellRange): IterableIterator<CellValue> {
    for (const address of range.addresses()) {
      yield this.getCellValue(address)
    }
  }

  public* entriesFromRange(range: AbsoluteCellRange): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    for (const address of range.addresses()) {
      yield [address, this.getCell(address)]
    }
  }

  public* entriesFromSheet(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    yield* this.mapping.get(sheet)!.getEntries(sheet)
  }

  public* verticesFromColumn(sheet: number, column: number): IterableIterator<CellVertex> {
    yield* this.mapping.get(sheet)!.verticesFromColumn(column)
  }

  public* verticesFromRow(sheet: number, row: number): IterableIterator<CellVertex> {
    yield* this.mapping.get(sheet)!.verticesFromRow(row)
  }
}
