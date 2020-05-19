/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {EmptyValue, InternalCellValue, InternalCellValueOrRange, SimpleCellAddress} from '../../Cell'
import {ColumnsSpan} from '../../ColumnsSpan'
import {RowsSpan} from '../../RowsSpan'
import {MatrixVertex} from '../index'
import {CellVertex} from '../Vertex'
import {ChooseAddressMapping} from './ChooseAddressMappingPolicy'
import {IAddressMappingStrategy} from './IAddressMappingStrategy'
import {NoSheetWithIdError} from '../../errors'
import {Sheet, SheetBoundaries} from '../../Sheet'

export class AddressMapping {
  private mapping: Map<number, IAddressMappingStrategy> = new Map()

  constructor(
    private readonly policy: ChooseAddressMapping
  ) {
  }

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): CellVertex | null {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
      throw new NoSheetWithIdError(address.sheet)
    }
    return sheetMapping.getCell(address)
  }

  public fetchCell(address: SimpleCellAddress): CellVertex {
    const sheetMapping = this.mapping.get(address.sheet)
    if (!sheetMapping) {
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
    if (!strategy) {
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

  public getCellValue(address: SimpleCellAddress): InternalCellValueOrRange {
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

  public removeSheet(sheetId: number) {
    this.mapping.delete(sheetId)
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

  public* entries(): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    for (const [sheet, mapping] of this.mapping.entries()) {
      yield* mapping.getEntries(sheet)
    }
  }

  public* sheetEntries(sheet: number): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const sheetMapping = this.mapping.get(sheet)
    if (sheetMapping) {
      yield* sheetMapping.getEntries(sheet)
    } else {
      throw new Error('Sheet does not exists')
    }
  }

  public destroy(): void {
    this.mapping.clear()
  }
}
