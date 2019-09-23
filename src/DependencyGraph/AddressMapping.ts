import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellValue, EmptyValue, SheetCellAddress, SimpleCellAddress, simpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Sheet} from '../GraphBuilder'
import {RowsSpan} from '../RowsSpan'
import {MatrixVertex} from './'
import {CellVertex} from './Vertex'

class DenseSparseChooseBasedOnThreshold {
  constructor(
    private readonly threshold: number
  ) {
  }

  public call(fill: number): IAddressMappingStrategyConstructor {
    if (fill > this.threshold) {
      return DenseStrategy
    } else {
      return SparseStrategy
    }
  }
}

export type IAddressMappingStrategyConstructor = new (width: number, height: number) => IAddressMappingStrategy

/**
 * Interface for mapping from sheet addresses to vertices.
 */
export interface IAddressMappingStrategy {
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
  removeRows(removedRows: RowsSpan): void,
  addColumns(column: number, numberOfColumns: number): void,
  removeColumns(removedColumns: ColumnsSpan): void,
  getEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex | null]>,
  verticesFromColumn(column: number): IterableIterator<CellVertex>,
  verticesFromRow(row: number): IterableIterator<CellVertex>,
  verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex>,
  verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex>,
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

  public removeRows(removedRows: RowsSpan): void {
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      const tmpMapping = new Map()
      rowMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        if (rowNumber >= removedRows.rowStart) {
          rowMapping.delete(rowNumber)
          if (rowNumber > removedRows.rowEnd) {
            tmpMapping.set(rowNumber - removedRows.numberOfRows, vertex)
          }
        }
      })
      tmpMapping.forEach((vertex: CellVertex, rowNumber: number) => {
        rowMapping.set(rowNumber, vertex)
      })
    })
    const rightmostRowRemoved = Math.min(this.height - 1, removedRows.rowEnd)
    const numberOfRowsRemoved = Math.max(0, rightmostRowRemoved - removedRows.rowStart + 1)
    this.height = Math.max(0, this.height - numberOfRowsRemoved)
  }

  public removeColumns(removedColumns: ColumnsSpan): void {
    const tmpMapping = new Map()
    this.mapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      if (colNumber >= removedColumns.columnStart) {
        this.mapping.delete(colNumber)
        if (colNumber > removedColumns.columnEnd) {
          tmpMapping.set(colNumber - removedColumns.numberOfColumns, rowMapping)
        }
      }
    })
    tmpMapping.forEach((rowMapping: Map<number, CellVertex>, colNumber: number) => {
      this.mapping.set(colNumber, rowMapping)
    })
    const rightmostColumnRemoved = Math.min(this.width - 1, removedColumns.columnEnd)
    const numberOfColumnsRemoved = Math.max(0, rightmostColumnRemoved - removedColumns.columnStart + 1)
    this.width = Math.max(0, this.width - numberOfColumnsRemoved)
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

  public* verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex> {
    for (const column of columnsSpan.columns()) {
      const colMapping = this.mapping.get(column)
      if (!colMapping) {
        continue
      }
      for (const [rowNumber, vertex] of colMapping) {
        yield vertex
      }
    }
  }

  public* verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex> {
    for (const colMapping of this.mapping.values()) {
      for (const row of rowsSpan.rows()) {
        const rowVertex = colMapping.get(row)
        if (rowVertex) {
          yield rowVertex
        }
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

  public removeRows(removedRows: RowsSpan): void {
    this.mapping.splice(removedRows.rowStart, removedRows.numberOfRows)
    const rightmostRowRemoved = Math.min(this.height - 1, removedRows.rowEnd)
    const numberOfRowsRemoved = Math.max(0, rightmostRowRemoved - removedRows.rowStart + 1)
    this.height = Math.max(0, this.height - numberOfRowsRemoved)
  }

  public removeColumns(removedColumns: ColumnsSpan): void {
    for (let i = 0; i < this.height; i++) {
      this.mapping[i].splice(removedColumns.columnStart, removedColumns.numberOfColumns)
    }
    const rightmostColumnRemoved = Math.min(this.width - 1, removedColumns.columnEnd)
    const numberOfColumnsRemoved = Math.max(0, rightmostColumnRemoved - removedColumns.columnStart + 1)
    this.width = Math.max(0, this.width - numberOfColumnsRemoved)
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

  public* verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex> {
    for (let x = columnsSpan.columnStart; x <= columnsSpan.columnEnd; ++x) {
      for (let y = 0; y < this.height; ++y) {
        const vertex = this.mapping[y][x]
        if (vertex) {
          yield vertex
        }
      }
    }
  }

  public* verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex> {
    for (let x = 0; x < this.width; ++x) {
      for (let y = rowsSpan.rowStart; y <= rowsSpan.rowEnd; ++y) {
        const vertex = this.mapping[y][x]
        if (vertex) {
          yield vertex
        }
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
    const chooseAddressMappingPolicy = new DenseSparseChooseBasedOnThreshold(this.threshold)
    const strategyConstructor = chooseAddressMappingPolicy.call(fill)
    this.addSheet(sheetId, new strategyConstructor(width, height))
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

  public removeRows(removedRows: RowsSpan) {
    const sheetMapping = this.mapping.get(removedRows.sheet)
    if (!sheetMapping) {
      throw Error('Sheet does not exist')
    }
    sheetMapping.removeRows(removedRows)
  }

  public addColumns(sheet: number, column: number, numberOfColumns: number) {
    const sheetMapping = this.mapping.get(sheet)
    if (!sheetMapping) {
      throw Error('Sheet does not exist')
    }
    sheetMapping.addColumns(column, numberOfColumns)
  }

  public removeColumns(removedColumns: ColumnsSpan) {
    const sheetMapping = this.mapping.get(removedColumns.sheet)
    if (!sheetMapping) {
      throw Error('Sheet does not exist')
    }
    sheetMapping.removeColumns(removedColumns)
  }

  public* verticesFromRange(range: AbsoluteCellRange): IterableIterator<CellVertex> {
    for (const address of range.addresses()) {
      const vertex = this.getCell(address)
      if (vertex) {
        yield vertex
      }
    }
  }

  public* verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(columnsSpan.sheet)!.verticesFromColumnsSpan(columnsSpan)
  }

  public* verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(rowsSpan.sheet)!.verticesFromRowsSpan(rowsSpan)
  }

  public* valuesFromSheet(sheet: number): IterableIterator<[CellValue, SimpleCellAddress]> {
    const sheetMapping = this.mapping.get(sheet)
    if (sheetMapping) {
      yield* this.valuesFromRange(AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, 0, 0), sheetMapping.getWidth(), sheetMapping.getHeight()))
    }
  }

  public* valuesFromRange(range: AbsoluteCellRange): IterableIterator<[CellValue, SimpleCellAddress]> {
    for (const address of range.addresses()) {
      const value = this.getCellValue(address)
      if (value !== EmptyValue) {
        yield [value, address]
      }
    }
  }

  public* entriesFromRange(range: AbsoluteCellRange): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    for (const address of range.addresses()) {
      yield [address, this.getCell(address)]
    }
  }

  public* entries(): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    for (const [sheet, mapping] of this.mapping.entries()) {
      yield* mapping.getEntries(sheet)
    }
  }

  public* verticesFromColumn(sheet: number, column: number): IterableIterator<CellVertex> {
    yield* this.mapping.get(sheet)!.verticesFromColumn(column)
  }

  public* verticesFromRow(sheet: number, row: number): IterableIterator<CellVertex> {
    yield* this.mapping.get(sheet)!.verticesFromRow(row)
  }
}
