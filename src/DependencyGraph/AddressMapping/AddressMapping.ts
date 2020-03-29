/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {EmptyValue, InternalCellValue, SimpleCellAddress, simpleCellAddress} from '../../Cell'
import {ColumnsSpan} from '../../ColumnsSpan'
import {Sheet} from '../../GraphBuilder'
import {RowsSpan} from '../../RowsSpan'
import {MatrixVertex} from '../index'
import {CellVertex} from '../Vertex'
import {ChooseAddressMapping} from './ChooseAddressMappingPolicy'
import {IAddressMappingStrategy} from './IAddressMappingStrategy'

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
  private mapping: Map<number, IAddressMappingStrategy> = new Map()

  constructor(
    private readonly policy: ChooseAddressMapping,
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
    const strategyConstructor = this.policy.call(fill)
    this.addSheet(sheetId, new strategyConstructor(width, height))
  }

  public getCellValue(address: SimpleCellAddress): InternalCellValue {
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

  public* verticesFromRange(range: AbsoluteCellRange): IterableIterator<CellVertex> {
    for (const address of range.addresses()) {
      const vertex = this.getCell(address)
      if (vertex) {
        yield vertex
      }
    }
  }

  public* verticesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(columnsSpan.sheet)!.verticesFromColumnsSpan(columnsSpan) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  public* verticesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<CellVertex> {
    yield* this.mapping.get(rowsSpan.sheet)!.verticesFromRowsSpan(rowsSpan) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  public* valuesFromSheet(sheet: number): IterableIterator<[InternalCellValue, SimpleCellAddress]> {
    const sheetMapping = this.mapping.get(sheet)
    if (sheetMapping) {
      yield* this.valuesFromRange(AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, 0, 0), sheetMapping.getWidth(), sheetMapping.getHeight()))
    }
  }

  public* valuesFromRange(range: AbsoluteCellRange): IterableIterator<[InternalCellValue, SimpleCellAddress]> {
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

  public* entriesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<[SimpleCellAddress, CellVertex]> {
    yield* this.mapping.get(rowsSpan.sheet)!.entriesFromRowsSpan(rowsSpan)
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

  public* verticesFromColumn(sheet: number, column: number): IterableIterator<CellVertex> {
    yield* this.mapping.get(sheet)!.verticesFromColumn(column) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  public* verticesFromRow(sheet: number, row: number): IterableIterator<CellVertex> {
    yield* this.mapping.get(sheet)!.verticesFromRow(row) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }

  public destroy(): void {
    this.mapping.clear()
  }
}
