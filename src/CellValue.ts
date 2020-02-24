import {CellError, ErrorType, InternalCellValue, NoErrorCellValue} from './Cell'
import {Config} from './Config'

export type CellValue = NoErrorCellValue | DetailedCellError

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

export class CellValueExporter {
  constructor(
    private readonly config: Config,
  ) {
  }

  public export(value: InternalCellValue): CellValue {
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
