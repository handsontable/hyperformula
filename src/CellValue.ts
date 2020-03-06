import {CellError, ErrorType, InternalCellValue, NoErrorCellValue, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellValueChange} from './ContentChanges'
import {Config} from './Config'
import {NamedExpressions} from './NamedExpressions'

export type Maybe<T> = T | undefined

export type CellValue = NoErrorCellValue | DetailedCellError

export type ExportedChange = ExportedCellChange | ExportedNamedExpressionChange

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
  constructor(
    public readonly error: CellError,
    public readonly value: string,
  ) {
  }

  public get type(): ErrorType {
    return this.error.type
  }

  public get message(): string {
    return this.error.message || ''
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
      return new ExportedNamedExpressionChange(
        this.namedExpressions.fetchNameForNamedExpressionRow(change.row),
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
    if (this.config.smartRounding && typeof value == 'number' && !Number.isInteger(value)) {
      return this.cellValueRounding(value)
    } else if (value instanceof CellError) {
      return this.detailedError(value)
    } else {
      return value
    }
  }

  private detailedError(error: CellError): DetailedCellError {
    return new DetailedCellError(error, this.config.getErrorTranslationFor(error.type))
  }

  private cellValueRounding(value: number): number {
    const placesMultiplier = Math.pow(10, this.config.precisionRounding)
    if (value < 0) {
      return -Math.round(-value * placesMultiplier) / placesMultiplier
    } else {
      return Math.round(value * placesMultiplier) / placesMultiplier
    }
  }
}
