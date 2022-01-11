/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {RawCellContent} from '../../CellContentParser'
import {NoSheetWithIdError} from '../../errors'
import {EmptyValue, InterpreterValue} from '../../interpreter/InterpreterValue'
import {Maybe} from '../../Maybe'
import {Sheet, SheetBoundaries} from '../../Sheet'
import {ColumnsSpan, RowsSpan} from '../../Span'
import {ArrayVertex, ValueCellVertex} from '../index'
import {CellVertex} from '../Vertex'
import {ChooseAddressMapping} from './ChooseAddressMappingPolicy'
import {IAddressMappingStrategy} from './IAddressMappingStrategy'

export class AddressMapping {
  private mapping: Map<number, IAddressMappingStrategy> = new Map()

  constructor(
    private readonly policy: ChooseAddressMapping
  ) {
  }

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): Maybe<CellVertex> {
    const sheetMapping = this.mapping.get(address.sheet)
    if (sheetMapping === undefined) {
      throw new NoSheetWithIdError(address.sheet)
    }
    return sheetMapping.getCell(address)
  }

  public fetchCell(address: SimpleCellAddress): CellVertex {
    const sheetMapping = this.mapping.get(address.sheet)
    if (sheetMapping === undefined) {
      throw  new NoSheetWithIdError(address.sheet)
    }
    const vertex = sheetMapping.getCell(address)
    if (!vertex) {
      throw Error('Vertex for address missing in AddressMapping')
    }
    return vertex
  }

  public strategyFor(sheetId: number): IAddressMappingStrategy {
    const strategy = this.mapping.get(sheetId)
    if (strategy === undefined) {
      throw new NoSheetWithIdError(sheetId)
    }

    return strategy
  }

  public addSheet(sheetId: number, strategy: IAddressMappingStrategy) {
    if (this.mapping.has(sheetId)) {
      throw Error('Sheet already added')
    }

    this.mapping.set(sheetId, strategy)
  }

  public autoAddSheet(sheetId: number, sheet: Sheet, sheetBoundaries: SheetBoundaries) {
    const {height, width, fill} = sheetBoundaries
    const strategyConstructor = this.policy.call(fill)
    this.addSheet(sheetId, new strategyConstructor(width, height))
  }

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
  public getHeight(sheetId: number): number {
    const sheetMapping = this.mapping.get(sheetId)
    if (sheetMapping === undefined) {
      throw new NoSheetWithIdError(sheetId)
    }
    return sheetMapping.getHeight()
  }

  /** @inheritDoc */
  public getWidth(sheetId: number): number {
    const sheetMapping = this.mapping.get(sheetId)
    if (!sheetMapping) {
      throw new NoSheetWithIdError(sheetId)
    }
    return sheetMapping.getWidth()
  }

  public addRows(sheet: number, row: number, numberOfRows: number) {
    const sheetMapping = this.mapping.get(sheet)
    if (sheetMapping === undefined) {
      throw new NoSheetWithIdError(sheet)
    }
    sheetMapping.addRows(row, numberOfRows)
  }

  public removeRows(removedRows: RowsSpan) {
    const sheetMapping = this.mapping.get(removedRows.sheet)
    if (sheetMapping === undefined) {
      throw new NoSheetWithIdError(removedRows.sheet)
    }
    sheetMapping.removeRows(removedRows)
  }

  public removeSheet(sheetId: number) {
    this.mapping.delete(sheetId)
  }

  public addColumns(sheet: number, column: number, numberOfColumns: number) {
    const sheetMapping = this.mapping.get(sheet)
    if (sheetMapping === undefined) {
      throw new NoSheetWithIdError(sheet)
    }
    sheetMapping.addColumns(column, numberOfColumns)
  }

  public removeColumns(removedColumns: ColumnsSpan) {
    const sheetMapping = this.mapping.get(removedColumns.sheet)
    if (sheetMapping === undefined) {
      throw new NoSheetWithIdError(removedColumns.sheet)
    }
    sheetMapping.removeColumns(removedColumns)
  }

  public* verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(rowsSpan.sheet)!.verticesFromRowsSpan(rowsSpan) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  public* verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(columnsSpan.sheet)!.verticesFromColumnsSpan(columnsSpan) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  public* entriesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<[SimpleCellAddress, CellVertex]> {
    yield* this.mapping.get(rowsSpan.sheet)!.entriesFromRowsSpan(rowsSpan)
  }

  public* entriesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<[SimpleCellAddress, CellVertex]> {
    yield* this.mapping.get(columnsSpan.sheet)!.entriesFromColumnsSpan(columnsSpan)
  }

  public* entries(): IterableIterator<[SimpleCellAddress, Maybe<CellVertex>]> {
    for (const [sheet, mapping] of this.mapping.entries()) {
      yield* mapping.getEntries(sheet)
    }
  }

  public* sheetEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const sheetMapping = this.mapping.get(sheet)
    if (sheetMapping !== undefined) {
      yield* sheetMapping.getEntries(sheet)
    } else {
      throw new NoSheetWithIdError(sheet)
    }
  }
}
