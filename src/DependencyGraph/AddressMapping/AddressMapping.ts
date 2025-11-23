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
import {ArrayVertex, DenseStrategy, ValueCellVertex} from '../index'
import {CellVertex} from '../Vertex'
import {AlwaysDense, ChooseAddressMapping} from './ChooseAddressMappingPolicy'
import {AddressMappingStrategy} from './AddressMappingStrategy'

export interface AddressMappingAddSheetOptions {
  throwIfSheetNotExists: boolean,
}

/**
 * Manages cell vertices and provides access to vertex by SimpleCellAddress.
 * For each sheet it stores vertices according to AddressMappingStrategy: DenseStrategy or SparseStrategy.
 */
export class AddressMapping {
  private mapping: Map<number, AddressMappingStrategy> = new Map()

  constructor(
    private readonly policy: ChooseAddressMapping
  ) {}

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): Maybe<CellVertex> {
    const sheetMapping = this.getStrategyForSheet(address.sheet) // WHEN can I add a new sheet?
    return sheetMapping.getCell(address)
  }

  /**
   * Gets the cell vertex at the specified address or throws an error if not found.
   * @param {SimpleCellAddress} address - The cell address to retrieve
   * @returns {CellVertex} The cell vertex at the specified address
   * @throws Error if vertex is missing in AddressMapping
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
   * @param {number} sheetId - The sheet identifier
   * @returns {AddressMappingStrategy} The address mapping strategy for the sheet
   * @throws NoSheetWithIdError if sheet doesn't exist
   */
  public getStrategyForSheet(sheetId: number): AddressMappingStrategy {
    const strategy = this.mapping.get(sheetId)
    if (strategy === undefined) {
      throw new NoSheetWithIdError(sheetId)
    }

    return strategy
  }

  /**
   * Adds a new sheet with the specified strategy.
   * @param {number} sheetId - The sheet identifier
   * @param {AddressMappingStrategy} strategy - The address mapping strategy to use for this sheet
   * @returns {AddressMappingStrategy} The strategy that was added
   * @throws Error if sheet is already added
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
   * Adds a sheet and sets the strategy based on the sheet boundaries.
   * @param {number} sheetId - The sheet identifier
   * @param {SheetBoundaries} sheetBoundaries - The boundaries of the sheet (height, width, fill)
   * @param {AddressMappingAddSheetOptions} options - The options for adding the sheet
   * @throws {Error} if sheet doesn't exist and throwIfSheetNotExists is true
   */
  public addSheetAndSetStrategyBasedOnBounderies(sheetId: number, sheetBoundaries: SheetBoundaries, options: AddressMappingAddSheetOptions = { throwIfSheetNotExists: true }) {
    const {height, width, fill} = sheetBoundaries
    const strategyConstructor = this.policy.call(fill)
    this.addSheetWithStrategy(sheetId, new strategyConstructor(width, height), options)
  }

  /**
   * Adds a placeholder strategy for a sheet. If the sheet already exists, does nothing.
   * @param {number} sheetId - The sheet identifier
   */
  public addSheetStrategyPlaceholderIfNotExists(sheetId: number): void {
    if (this.mapping.has(sheetId)) {
      return
    }

    this.mapping.set(sheetId, new DenseStrategy(0, 0))
  }

  /**
   * Gets the interpreter value of a cell at the specified address.
   * @param {SimpleCellAddress} address - The cell address
   * @returns {InterpreterValue} The interpreter value (returns EmptyValue if cell doesn't exist)
   */
  public getCellValue(address: SimpleCellAddress): InterpreterValue {
    const vertex = this.getCell(address)

    if (vertex === undefined) {
      return EmptyValue
    } else if (vertex instanceof ArrayVertex) {
      return vertex.getArrayCellValue(address)
    } else {
      return vertex.getCellValue()
    }
  }

  /**
   * Gets the raw cell content at the specified address.
   * @param {SimpleCellAddress} address - The cell address
   * @returns {RawCellContent} The raw cell content or null if cell doesn't exist or is not a value cell
   */
  public getRawValue(address: SimpleCellAddress): RawCellContent {
    const vertex = this.getCell(address)
    if (vertex instanceof ValueCellVertex) {
      return vertex.getValues().rawValue
    } else if (vertex instanceof ArrayVertex) {
      return vertex.getArrayCellRawValue(address)
    } else {
      return null
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

  /**
   * Moves a cell from source address to destination address within the same sheet.
   * @param {SimpleCellAddress} source - The source cell address
   * @param {SimpleCellAddress} destination - The destination cell address
   * @throws Error if sheet not initialized, addresses on different sheets, destination occupied, or source cell doesn't exist
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
   * @param {SimpleCellAddress} address - The cell address to remove
   * @throws Error if sheet not initialized
   */
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
    if (sheetMapping === undefined) {
      return false
    }
    return sheetMapping.has(address)
  }

  /** @inheritDoc */
  public getSheetHeight(sheetId: number): number {
    const sheetMapping = this.getStrategyForSheet(sheetId)
    return sheetMapping.getHeight()
  }

  /** @inheritDoc */
  public getSheetWidth(sheetId: number): number {
    const sheetMapping = this.getStrategyForSheet(sheetId)
    return sheetMapping.getWidth()
  }

  /**
   * Adds rows to a sheet starting at the specified row index.
   * @param {number} sheet - The sheet identifier
   * @param {number} row - The row index where rows should be added
   * @param {number} numberOfRows - The number of rows to add
   */
  public addRows(sheet: number, row: number, numberOfRows: number) {
    const sheetMapping = this.getStrategyForSheet(sheet)
    sheetMapping.addRows(row, numberOfRows)
  }

  /**
   * Removes rows from a sheet.
   * @param {RowsSpan} removedRows - The span of rows to remove
   */
  public removeRows(removedRows: RowsSpan) {
    const sheetMapping = this.getStrategyForSheet(removedRows.sheet)
    sheetMapping.removeRows(removedRows)
  }

  /**
   * Removes a sheet from the address mapping.
   * @param {number} sheetId - The sheet identifier to remove
   */
  public removeSheet(sheetId: number) {
    this.mapping.delete(sheetId)
  }

  /**
   * Adds columns to a sheet starting at the specified column index.
   * @param {number} sheet - The sheet identifier
   * @param {number} column - The column index where columns should be added
   * @param {number} numberOfColumns - The number of columns to add
   */
  public addColumns(sheet: number, column: number, numberOfColumns: number) {
    const sheetMapping = this.getStrategyForSheet(sheet)
    sheetMapping.addColumns(column, numberOfColumns)
  }

  /**
   * Removes columns from a sheet.
   * @param {ColumnsSpan} removedColumns - The span of columns to remove
   */
  public removeColumns(removedColumns: ColumnsSpan) {
    const sheetMapping = this.getStrategyForSheet(removedColumns.sheet)
    sheetMapping.removeColumns(removedColumns)
  }

  /**
   * Returns an iterator of cell vertices within the specified rows span.
   * @param {RowsSpan} rowsSpan - The span of rows to iterate over
   * @returns {IterableIterator<CellVertex>} Iterator of cell vertices
   */
  public* verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(rowsSpan.sheet)!.verticesFromRowsSpan(rowsSpan) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  /**
   * Returns an iterator of cell vertices within the specified columns span.
   * @param {ColumnsSpan} columnsSpan - The span of columns to iterate over
   * @returns {IterableIterator<CellVertex>} Iterator of cell vertices
   */
  public* verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(columnsSpan.sheet)!.verticesFromColumnsSpan(columnsSpan) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  /**
   * Returns an iterator of address-vertex pairs within the specified rows span.
   * @param {RowsSpan} rowsSpan - The span of rows to iterate over
   * @returns {IterableIterator<[SimpleCellAddress, CellVertex]>} Iterator of [address, vertex] tuples
   */
  public* entriesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const sheetMapping = this.getStrategyForSheet(rowsSpan.sheet)
    yield* sheetMapping.entriesFromRowsSpan(rowsSpan)
  }

  /**
   * Returns an iterator of address-vertex pairs within the specified columns span.
   * @param {ColumnsSpan} columnsSpan - The span of columns to iterate over
   * @returns {IterableIterator<[SimpleCellAddress, CellVertex]>} Iterator of [address, vertex] tuples
   */
  public* entriesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const sheetMapping = this.getStrategyForSheet(columnsSpan.sheet)
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
   * @param {number} sheet - The sheet identifier
   * @returns {IterableIterator<[SimpleCellAddress, CellVertex]>} Iterator of [address, vertex] tuples
   * @throws NoSheetWithIdError if sheet doesn't exist
   */
  public* sheetEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const sheetMapping = this.mapping.get(sheet)
    if (sheetMapping !== undefined) {
      yield* sheetMapping.getEntries(sheet)
    } else {
      throw new NoSheetWithIdError(sheet)
    }
  }
}
