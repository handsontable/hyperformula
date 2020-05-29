/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, EmptyValue, ErrorType, InternalCellValue, simpleCellAddress, SimpleCellAddress} from './Cell'
import {Config} from './Config'
import {CellValueChange} from './ContentChanges'
import {NamedExpressions} from './NamedExpressions'
import {SimpleRangeValue} from './interpreter/InterpreterValue'

export type NoErrorCellValue = number | string | boolean | null
export type CellValue = NoErrorCellValue | DetailedCellError

export type ExportedChange = ExportedCellChange | ExportedNamedExpressionChange

/**
 * A list of cells which values changed after the operation, their absolute addresses and new values.
 */
export class ExportedCellChange {
  constructor(
    public readonly address: SimpleCellAddress,
    public readonly newValue: CellValue,
  ) {
  }

  public get col() {
    return this.address.col
  }

  public get row() {
    return this.address.row
  }

  public get sheet() {
    return this.address.sheet
  }

  public get value() {
    return this.newValue
  }
}

export class ExportedNamedExpressionChange {
  constructor(
    public readonly name: string,
    public readonly newValue: CellValue,
  ) {
  }
}

export class DetailedCellError {
  public readonly type: ErrorType
  public readonly message: string

  constructor(
    error: CellError,
    public readonly value: string,
  ) {
    this.type = error.type
    this.message = error.message || ''
  }
}

export class Exporter {
  constructor(
    private readonly config: Config,
    private readonly namedExpressions: NamedExpressions,
  ) {
  }

  public exportChange(change: CellValueChange): ExportedChange {
    if (change.sheet === NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS) {
      const namedExpression = this.namedExpressions.namedExpressionInAddress(change.row)
      if (!namedExpression) {
        throw 'Missing named expression'
      }
      return new ExportedNamedExpressionChange(
        namedExpression.displayName,
        this.exportValue(change.value),
      )
    } else {
      return new ExportedCellChange(
        simpleCellAddress(change.sheet, change.col, change.row),
        this.exportValue(change.value),
      )
    }
  }

  public exportValue(value: InternalCellValue): CellValue {
    if (value instanceof SimpleRangeValue) {
      return this.detailedError(new CellError(ErrorType.VALUE))
    } else if (this.config.smartRounding && typeof value == 'number') {
      return this.cellValueRounding(value)
    } else if (value instanceof CellError) {
      return this.detailedError(value)
    } else if (value === EmptyValue) {
      return null
    } else {
      return value
    }
  }

  private detailedError(error: CellError): DetailedCellError {
    return new DetailedCellError(error, this.config.translationPackage.getErrorTranslation(error.type))
  }

  private cellValueRounding(value: number): number {
    if (value === 0) {
      return value
    }
    const magnitudeMultiplierExponent = Math.floor(Math.log10(Math.abs(value)))
    const placesMultiplier = Math.pow(10, this.config.precisionRounding - magnitudeMultiplierExponent)
    if (value < 0) {
      return -Math.round(-value * placesMultiplier) / placesMultiplier
    } else {
      return Math.round(value * placesMultiplier) / placesMultiplier
    }
  }
}
