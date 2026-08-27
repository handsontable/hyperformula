import {DetailedCellError} from '../../src'
import {CellError, ErrorType, SimpleCellAddress, simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'

export const adr = (stringAddress: string, sheet: number = 0): SimpleCellAddress => {

  const result = /^(\$([A-Za-z0-9_]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/.exec(stringAddress)!
  const row = Number(result[6]) - 1
  return simpleCellAddress(sheet, colNumber(result[4]), row)
}

const colNumber = (input: string): number => {
  if (input.length === 1) {
    return input.toUpperCase().charCodeAt(0) - 65
  } else {
    return input.split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }
}

/**
 * Builds the DetailedCellError that the engine exports for a given error type,
 * so that it can be compared against a cell value with the toEqualError matcher.
 *
 * @param {ErrorType} errorType - the type of the expected error
 * @param {string} message - the expected error message
 * @param {Config} config - the configuration of the engine under test, used to translate the error type
 */
export function detailedError(errorType: ErrorType, message?: string, config?: Config): DetailedCellError {
  config = new Config(config)
  const error = new CellError(errorType, message)
  return new DetailedCellError(error, config.translationPackage.getErrorTranslation(errorType))
}
