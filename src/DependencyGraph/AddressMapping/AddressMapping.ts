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
import {CellVertex} from '../CellVertex'
import {ChooseAddressMapping} from './ChooseAddressMappingPolicy'
import {AddressMappingStrategy} from './AddressMappingStrategy'

/**
 * Options for adding a sheet to the address mapping.
 */
export interface AddressMappingAddSheetOptions {
  throwIfSheetAlreadyExists: boolean,
}

export interface AddressMappingGetCellOptions {
  throwIfSheetNotExists?: boolean,
  throwIfCellNotExists?: boolean,
}

/**
 * Manages cell vertices and provides access to vertex by SimpleCellAddress.
 * For each sheet it stores vertices according to AddressMappingStrategy: DenseStrategy or SparseStrategy.
 *
 * Pleceholder sheets:
 * - for placeholders sheets (sheets that are used in formulas but not yet added), it stores placeholder strategy entries (DenseStrategy(0, 0))
 * - placeholder strategy entries may contain EmptyCellVertex-es but never ValueCellVertex or FormulaVertex as they content is empty
 * - vertices in placeholder strategy entries are used only for dependency tracking
 */
export class AddressMapping {
  private mapping: Map<number, AddressMappingStrategy> = new Map()

  constructor(
    private readonly policy: ChooseAddressMapping,
  ) {}

  /**
   * Gets the cell vertex at the specified address.
   */
  public getCell(address: SimpleCellAddress, options: AddressMappingGetCellOptions = {}): Maybe<CellVertex> {
    const sheetMapping = this.mapping.get(address.sheet)

    if (!sheetMapping) {
      if (options.throwIfSheetNotExists) {
        throw new NoSheetWithIdError(address.sheet)
      }
      return undefined
    }

    const cell = sheetMapping.getCell(address)

    if (!cell && options.throwIfCellNotExists) {
      throw Error('Vertex for address missing in AddressMapping')
    }

    return cell
  }

  /**
   * Gets the cell vertex at the specified address or throws if it doesn't exist.
   * @throws {NoSheetWithIdError} if sheet doesn't exist
   * @throws {Error} if cell doesn't exist
   */
  public getCellOrThrow(address: SimpleCellAddress): CellVertex {
    const sheetMapping = this.mapping.get(address.sheet)

    if (!sheetMapping) {
      throw new NoSheetWithIdError(address.sheet)
    }

    const cell = sheetMapping.getCell(address)
    if (!cell) {
      throw Error('Vertex for address missing in AddressMapping')
    }

    return cell
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
   * @throws {Error} if sheet is already added and throwIfSheetAlreadyExists is true
   */
  public addSheetWithStrategy(sheetId: number, strategy: AddressMappingStrategy, options: AddressMappingAddSheetOptions = { throwIfSheetAlreadyExists: true }): AddressMappingStrategy {
    const strategyFound = this.mapping.get(sheetId)

    if (strategyFound) {
      if (options.throwIfSheetAlreadyExists) {
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

    if (newStrategy instanceof DenseStrategy) { // new strategy is the same as the placeholder
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
   * @throws {Error} if sheet already exists and throwIfSheetAlreadyExists is true
   */
  public addSheetAndSetStrategyBasedOnBoundaries(sheetId: number, sheetBoundaries: SheetBoundaries, options: AddressMappingAddSheetOptions = { throwIfSheetAlreadyExists: true }) {
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
   * If sheet does not exist, does nothing.
   * @returns {boolean} true if sheet was removed, false if it did not exist.
   */
  public removeSheetIfExists(sheetId: number): boolean {
    return this.mapping.delete(sheetId)
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
   * Moves a cell from source address to destination address.
   * Supports cross-sheet moves (used for placeholder sheet merging).
   * @throws {Error} if source sheet not initialized
   * @throws {Error} if destination occupied
   * @throws {Error} if source cell doesn't exist
   */
  public moveCell(source: SimpleCellAddress, destination: SimpleCellAddress) {
    const sheetMapping = this.mapping.get(source.sheet)

    if (!sheetMapping) {
      throw Error('Sheet not initialized.')
    }

    if (this.has(destination)) {
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
  public getSheetWidth(sheetId: number): number {
    const sheetMapping = this.getStrategyForSheetOrThrow(sheetId)
    return sheetMapping.getWidth()
  }

  /**
   * Adds rows to a sheet.
   */
  public addRows(sheetId: number, row: number, numberOfRows: number) {
    const sheetMapping = this.getStrategyForSheetOrThrow(sheetId)
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
  public addColumns(sheetId: number, column: number, numberOfColumns: number) {
    const sheetMapping = this.getStrategyForSheetOrThrow(sheetId)
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
   * Checks if a sheet has any entries.
   * @throws {NoSheetWithIdError} if sheet doesn't exist
   */
  public hasAnyEntries(sheetId: number): boolean {
    const iterator = this.sheetEntries(sheetId)
    return !iterator.next().done
  }
}
