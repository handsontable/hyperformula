/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from './Cell'
import {CellValue, DetailedCellError} from './CellValue'
import {Config} from './Config'
import {CellValueChange, ChangeExporter} from './ContentChanges'
import {ErrorMessage} from './error-message'
import {EmptyValue, getRawValue, InterpreterValue, isExtendedNumber} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './interpreter/SimpleRangeValue'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {NamedExpressions} from './NamedExpressions'
import {SheetIndexMappingFn, simpleCellAddressToString} from './parser/addressRepresentationConverters'

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
    public readonly newValue: CellValue | CellValue[][] | CellError,
  ) {
  }
}

export class Exporter implements ChangeExporter<ExportedChange> {
  constructor(
    private readonly config: Config,
    private readonly namedExpressions: NamedExpressions,
    private readonly sheetIndexMapping: SheetIndexMappingFn,
    private readonly lazilyTransformingService: LazilyTransformingAstService,
  ) {
  }

  public exportChange(change: CellValueChange): ExportedChange | ExportedChange[] {
    const value = change.value
    const address = change.address

    if (address.sheet === NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS) {
      const namedExpression = this.namedExpressions.namedExpressionInAddress(address.row)
      if (!namedExpression) {
        throw new Error('Missing named expression')
      }
      return new ExportedNamedExpressionChange(
        namedExpression.displayName,
        this.exportScalarOrRange(value),
      )
    } else if (value instanceof SimpleRangeValue) {
      const result: ExportedChange[] = []
      for (const [cellValue, cellAddress] of value.entriesFromTopLeftCorner(address)) {
        result.push(new ExportedCellChange(
          cellAddress,
          this.exportValue(cellValue)
        ))
      }
      return result
    } else {
      return new ExportedCellChange(
        address,
        this.exportValue(value),
      )
    }
  }

  public exportValue(value: InterpreterValue): CellValue {
    if (value instanceof SimpleRangeValue) {
      return this.detailedError(new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
    } else if (this.config.smartRounding && isExtendedNumber(value)) {
      return this.cellValueRounding(getRawValue(value))
    } else if (value instanceof CellError) {
      return this.detailedError(value)
    } else if (value === EmptyValue) {
      return null
    } else {
      return getRawValue(value)
    }
  }

  public exportScalarOrRange(value: InterpreterValue): CellValue | CellValue[][] {
    if (value instanceof SimpleRangeValue) {
      return value.rawData().map(row => row.map(v => this.exportValue(v)))
    } else {
      return this.exportValue(value)
    }
  }

  private detailedError(error: CellError): DetailedCellError {
    let address = undefined
    const originAddress = error.root?.getAddress(this.lazilyTransformingService)
    if (originAddress !== undefined) {
      if (originAddress.sheet === NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS) {
        address = this.namedExpressions.namedExpressionInAddress(originAddress.row)?.displayName
      } else {
        address = simpleCellAddressToString(this.sheetIndexMapping, originAddress, -1)
      }
    }
    return new DetailedCellError(error, this.config.translationPackage.getErrorTranslation(error.type), address)
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
