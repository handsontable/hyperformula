/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {RawCellContent} from '../../CellContentParser'
import {NoSheetWithIdError} from '../../errors'
import {EmptyValue, InterpreterValue} from '../../interpreter/InterpreterValue'
import {Maybe} from '../../Maybe'
import {SheetBoundaries} from '../../Sheet'
import {ColumnsSpan, RowsSpan} from '../../Span'
import {ArrayFormulaVertex, DenseStrategy, ValueCellVertex} from '../index'
import {CellVertex} from '../Vertex'
import {ChooseAddressMapping} from './ChooseAddressMappingPolicy'
import {AddressMappingStrategy} from './AddressMappingStrategy'

/**
 * Options for adding a sheet to the address mapping.
 */
export interface AddressMappingAddSheetOptions {
  throwIfSheetNotExists: boolean,
}

/**
 * Manages cell vertices and provides access to vertex by SimpleCellAddress.
 * For each sheet it stores vertices according to AddressMappingStrategy: DenseStrategy or SparseStrategy.
 * It also stores placeholder entries (DenseStrategy(0, 0)) for sheets that are used in formulas but not yet added.
 */
export class AddressMapping {
  private mapping: Map<number, AddressMappingStrategy> = new Map()

  constructor(
    private readonly policy: ChooseAddressMapping,
  ) {}

  /**
   * Gets the cell vertex at the specified address.
   */
  public getCell(address: SimpleCellAddress): Maybe<CellVertex> {
    const sheetMapping = this.getStrategyForSheetOrThrow(address.sheet)
    return sheetMapping.getCell(address)
  }

  /**
   * Gets the cell vertex at the specified address or throws an error if not found.
   */
  public getCellOrThrowError(address: SimpleCellAddress): CellVertex {
    const vertex = this.getCell(address)

    if (!vertex) {
      throw Error('Vertex for address missing in AddressMapping')
    }
    return vertex
  }

  /**
   * Gets the address mapping strategy for the specified sheet.
   * @throws {NoSheetWithIdError} if sheet doesn't exist
   */
  public getStrategyForSheetOrThrow(sheetId: number): AddressMappingStrategy {
    const strategy = this.mapping.get(sheetId)
    if (strategy === undefined) {
      throw new NoSheetWithIdError(sheetId)
    }

    return strategy
  }

  /**
   * Adds a new sheet with the specified strategy.
   * @throws {Error} if sheet is already added and throwIfSheetNotExists is true
   */
  public addSheetWithStrategy(sheetId: number, strategy: AddressMappingStrategy, options: AddressMappingAddSheetOptions = { throwIfSheetNotExists: true }): AddressMappingStrategy {
    const strategyFound = this.mapping.get(sheetId)

    if (strategyFound) {
      if (options.throwIfSheetNotExists) {
        throw Error('Sheet already added')
      }

      return strategyFound
    }

    this.mapping.set(sheetId, strategy)
    return strategy
  }

  /**
   * Adds a sheet or changes the strategy for an existing sheet.
   * Designed for the purpose of exchanging the placeholder strategy for a real strategy.
   */
  public addSheetOrChangeStrategy(sheetId: number, sheetBoundaries: SheetBoundaries): AddressMappingStrategy {
    const newStrategy = this.createStrategyBasedOnBoundaries(sheetBoundaries)
    const strategyPlaceholder = this.mapping.get(sheetId)

    if (!strategyPlaceholder) {
      this.mapping.set(sheetId, newStrategy)
      return newStrategy
    }

    if (newStrategy instanceof DenseStrategy) { // new startegy is the same as the placeholder
      return strategyPlaceholder
    }

    this.moveStrategyContent(strategyPlaceholder, newStrategy, sheetId)
    this.mapping.set(sheetId, newStrategy)

    return newStrategy
  }

  /**
   * Moves the content of the source strategy to the target strategy.
   */
  private moveStrategyContent(sourceStrategy: AddressMappingStrategy, targetStrategy: AddressMappingStrategy, sheetContext: number) {
    const sourceVertices = sourceStrategy.getEntries(sheetContext)
    for (const [address, vertex] of sourceVertices) {
      targetStrategy.setCell(address, vertex)
    }
  }

  /**
   * Adds a sheet and sets the strategy based on the sheet boundaries.
   * @throws {Error} if sheet doesn't exist and throwIfSheetNotExists is true
   */
  public addSheetAndSetStrategyBasedOnBounderies(sheetId: number, sheetBoundaries: SheetBoundaries, options: AddressMappingAddSheetOptions = { throwIfSheetNotExists: true }) {
    this.addSheetWithStrategy(sheetId, this.createStrategyBasedOnBoundaries(sheetBoundaries), options)
  }

  /**
   * Creates a strategy based on the sheet boundaries.
   */
  private createStrategyBasedOnBoundaries(sheetBoundaries: SheetBoundaries): AddressMappingStrategy {
    const {height, width, fill} = sheetBoundaries
    const strategyConstructor = this.policy.call(fill)
    return new strategyConstructor(width, height)
  }

  /**
   * Adds a placeholder strategy (DenseStrategy) for a sheet. If the sheet already exists, does nothing.
   */
  public addSheetStrategyPlaceholderIfNotExists(sheetId: number): void {
    if (this.mapping.has(sheetId)) {
      return
    }

    this.mapping.set(sheetId, new DenseStrategy(0, 0))
  }

  /**
   * Removes a sheet from the address mapping.
   */
  public removeSheet(sheetId: number): void {
    this.mapping.delete(sheetId)
  }

  /**
   * Gets the interpreter value of a cell at the specified address.
   * @returns {InterpreterValue} The interpreter value (returns EmptyValue if cell doesn't exist)
   */
  public getCellValue(address: SimpleCellAddress): InterpreterValue {
    const vertex = this.getCell(address)

    if (vertex === undefined) {
      return EmptyValue
    } else if (vertex instanceof ArrayFormulaVertex) {
      return vertex.getArrayCellValue(address)
    } else {
      return vertex.getCellValue()
    }
  }

  /**
   * Gets the raw cell content at the specified address.
   * @returns {RawCellContent} The raw cell content or null if cell doesn't exist or is not a value cell
   */
  public getRawValue(address: SimpleCellAddress): RawCellContent {
    const vertex = this.getCell(address)
    if (vertex instanceof ValueCellVertex) {
      return vertex.getValues().rawValue
    } else if (vertex instanceof ArrayFormulaVertex) {
      return vertex.getArrayCellRawValue(address)
    } else {
      return null
    }
  }

  /**
   * Sets a cell vertex at the specified address.
   * @throws {Error} if sheet not initialized
   */
  public setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    const sheetMapping = this.mapping.get(address.sheet)

    if (!sheetMapping) {
      throw Error('Sheet not initialized')
    }
    sheetMapping.setCell(address, newVertex)
  }

  /**
   * Moves a cell from source address to destination address within the same sheet.
   * @throws {Error} if sheet not initialized
   * @throws {Error} if addresses on different sheets
   * @throws {Error} if destination occupied
   * @throws {Error} if source cell doesn't exist
   */
  public moveCell(source: SimpleCellAddress, destination: SimpleCellAddress) {
    const sheetMapping = this.mapping.get(source.sheet)

    if (!sheetMapping) {
      throw Error('Sheet not initialized.')
    }

    if (source.sheet !== destination.sheet) {
      throw Error('Cannot move cells between sheets.')
    }

    if (sheetMapping.has(destination)) {
      throw new Error('Cannot move cell. Destination already occupied.')
    }

    const vertex = sheetMapping.getCell(source)

    if (vertex === undefined) {
      throw new Error('Cannot move cell. No cell with such address.')
    }

    this.setCell(destination, vertex)
    this.removeCell(source)
  }

  /**
   * Removes a cell at the specified address.
   * @throws Error if sheet not initialized
   */
  public removeCell(address: SimpleCellAddress) {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      throw Error('Sheet not initialized')
    }
    sheetMapping.removeCell(address)
  }

  /**
   * Checks if a cell exists at the specified address.
   */
  public has(address: SimpleCellAddress): boolean {
    const sheetMapping = this.mapping.get(address.sheet)
    if (sheetMapping === undefined) {
      return false
    }
    return sheetMapping.has(address)
  }

  /**
   * Gets the height of the specified sheet.
   */
  public getSheetHeight(sheetId: number): number {
    const sheetMapping = this.getStrategyForSheetOrThrow(sheetId)
    return sheetMapping.getHeight()
  }

  /**
   * Gets the width of the specified sheet.
   */
  public getSheetWidth(sheet: number): number {
    const sheetMapping = this.getStrategyForSheetOrThrow(sheet)
    return sheetMapping.getWidth()
  }

  /**
   * Adds rows to a sheet.
   */
  public addRows(sheet: number, row: number, numberOfRows: number) {
    const sheetMapping = this.getStrategyForSheetOrThrow(sheet)
    sheetMapping.addRows(row, numberOfRows)
  }

  /**
   * Removes rows from a sheet.
   */
  public removeRows(removedRows: RowsSpan) {
    const sheetMapping = this.getStrategyForSheetOrThrow(removedRows.sheet)
    sheetMapping.removeRows(removedRows)
  }

  /**
   * Adds columns to a sheet starting at the specified column index.
   */
  public addColumns(sheet: number, column: number, numberOfColumns: number) {
    const sheetMapping = this.getStrategyForSheetOrThrow(sheet)
    sheetMapping.addColumns(column, numberOfColumns)
  }

  /**
   * Removes columns from a sheet.
   */
  public removeColumns(removedColumns: ColumnsSpan) {
    const sheetMapping = this.getStrategyForSheetOrThrow(removedColumns.sheet)
    sheetMapping.removeColumns(removedColumns)
  }

  /**
   * Returns an iterator of cell vertices within the specified rows span.
   */
  public* verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(rowsSpan.sheet)!.verticesFromRowsSpan(rowsSpan) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  /**
   * Returns an iterator of cell vertices within the specified columns span.
   */
  public* verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(columnsSpan.sheet)!.verticesFromColumnsSpan(columnsSpan) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  /**
   * Returns an iterator of address-vertex pairs within the specified rows span.
   */
  public* entriesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const sheetMapping = this.getStrategyForSheetOrThrow(rowsSpan.sheet)
    yield* sheetMapping.entriesFromRowsSpan(rowsSpan)
  }

  /**
   * Returns an iterator of address-vertex pairs within the specified columns span.
   */
  public* entriesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const sheetMapping = this.getStrategyForSheetOrThrow(columnsSpan.sheet)
    yield* sheetMapping.entriesFromColumnsSpan(columnsSpan)
  }

  /**
   * Returns an iterator of all address-vertex pairs across all sheets.
   * @returns {IterableIterator<[SimpleCellAddress, Maybe<CellVertex>]>} Iterator of [address, vertex] tuples
   */
  public* entries(): IterableIterator<[SimpleCellAddress, Maybe<CellVertex>]> {
    for (const [sheet, mapping] of this.mapping.entries()) {
      yield* mapping.getEntries(sheet)
    }
  }

  /**
   * Returns an iterator of address-vertex pairs for a specific sheet.
   * @returns {IterableIterator<[SimpleCellAddress, CellVertex]>} Iterator of [address, vertex] tuples
   * @throws {NoSheetWithIdError} if sheet doesn't exist
   */
  public* sheetEntries(sheetId: number): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const sheetMapping = this.getStrategyForSheetOrThrow(sheetId)
    yield* sheetMapping.getEntries(sheetId)
  }

  /**
   * Checks if a sheet is empty.
   * @throws {NoSheetWithIdError} if sheet doesn't exist
   */
  public hasAnyEntries(sheetId: number): boolean {
    for (const _ of this.sheetEntries(sheetId)) {
      return true
    }

    return false
  }
}
