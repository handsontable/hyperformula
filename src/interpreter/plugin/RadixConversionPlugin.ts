import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {padLeft} from '../../format/format'
import {ProcedureAst} from '../../parser'
import {coerceScalarToNumber, coerceScalarToString} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

const NUMBER_OF_BITS = 10
const DECIMAL_NUMBER_OF_BITS = 255
const MIN_BASE = 2
const MAX_BASE = 36
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export class RadixConversionPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    dec2bin: {
      translationKey: 'DEC2BIN',
    },
    dec2oct: {
      translationKey: 'DEC2OCT',
    },
    dec2hex: {
      translationKey: 'DEC2HEX',
    },
    bin2dec: {
      translationKey: 'BIN2DEC',
    },
    bin2oct: {
      translationKey: 'BIN2OCT',
    },
    bin2hex: {
      translationKey: 'BIN2HEX',
    },
    decimal: {
      translationKey: 'DECIMAL',
    },
    base: {
      translationKey: 'BASE',
    },
  }

  public dec2bin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.dec2base(ast, formulaAddress, 2)
  }

  public dec2oct(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.dec2base(ast, formulaAddress, 8)
  }

  public dec2hex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.dec2base(ast, formulaAddress, 16)
  }

  public bin2dec(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const binaryWithSign = this.getFirstArgumentAsNumberInBase(ast, formulaAddress, 2, NUMBER_OF_BITS)
    if (binaryWithSign instanceof CellError) {
      return binaryWithSign
    }

    return twoComplementToDecimal(binaryWithSign)
  }

  public bin2oct(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.bin2base(ast, formulaAddress, 8)
  }

  public bin2hex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.bin2base(ast, formulaAddress, 16)
  }

  public base(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return new CellError(ErrorType.NA)
    }

    const value = this.getNumericArgument(ast, formulaAddress, 0)
    if (value instanceof CellError) {
      return value
    }

    const base = this.getNumericArgument(ast, formulaAddress, 1, MIN_BASE, MAX_BASE)
    if (base instanceof CellError) {
      return base
    }

    let padding
    if (ast.args.length === 3) {
      padding = this.getNumericArgument(ast, formulaAddress, 2, 0, DECIMAL_NUMBER_OF_BITS)
      if (padding instanceof CellError) {
        return padding
      }
    }

    if (value < 0) {
      return new CellError(ErrorType.NUM)
    }

    return decimalToBaseWithMinimumPadding(value, base, padding)
  }

  public decimal(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const base = this.getNumericArgument(ast, formulaAddress, 1, MIN_BASE, MAX_BASE)
    if (base instanceof CellError) {
      return base
    }

    const input = this.getFirstArgumentAsNumberInBase(ast, formulaAddress, base, DECIMAL_NUMBER_OF_BITS)
    if (input instanceof CellError) {
      return input
    }

    return parseInt(input, base)
  }

  private bin2base(ast: ProcedureAst, formulaAddress: SimpleCellAddress, base: number): CellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    }

    const binaryWithSign = this.getFirstArgumentAsNumberInBase(ast, formulaAddress, 2, NUMBER_OF_BITS)
    if (binaryWithSign instanceof CellError) {
      return binaryWithSign
    }

    let places
    if (ast.args.length === 2) {
      places = this.getNumericArgument(ast, formulaAddress, 1, 1, 10)
      if (places instanceof CellError) {
        return places
      }
    }

    const decimal = twoComplementToDecimal(binaryWithSign)
    return decimalToBaseWithExactPadding(decimal, base, places)
  }

  private dec2base(ast: ProcedureAst, formulaAddress: SimpleCellAddress, base: number): CellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    }

    let places
    if (ast.args.length === 2) {
      places = this.getNumericArgument(ast, formulaAddress, 1, 1, 10)
      if (places instanceof CellError) {
        return places
      }
    }

    const min = -Math.pow(base, NUMBER_OF_BITS) / 2
    const max = -min - 1

    const value = this.getNumericArgument(ast, formulaAddress, 0, min, max)
    if (value instanceof CellError) {
      return value
    }

    return decimalToBaseWithExactPadding(value, base, places)
  }

  private getFirstArgumentAsNumberInBase(ast: ProcedureAst, formulaAddress: SimpleCellAddress, base: number, maxLength: number): string | CellError {
    const arg = this.evaluateAst(ast.args[0], formulaAddress)

    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const value = coerceScalarToString(arg)
    if (typeof value === 'string') {
      const baseAlphabet = ALPHABET.substr(0, base)
      const regex = new RegExp(`^[${baseAlphabet}]+$`)
      if (value.length > maxLength || !regex.test(value)) {
        return new CellError(ErrorType.NUM)
      }
    }

    return value
  }

  private getNumericArgument(ast: ProcedureAst, formulaAddress: SimpleCellAddress, position: number, min?: number, max?: number): number | CellError {
    const arg = this.evaluateAst(ast.args[position], formulaAddress)

    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const value = coerceScalarToNumber(arg)
    if (typeof value === 'number') {
      if (min !== undefined && max !== undefined && (value < min || value > max)) {
        return new CellError(ErrorType.NUM)
      }
    }

    return value
  }
}

function decimalToBaseWithExactPadding(value: number, base: number, places?: number): string | CellError {
  const result = decimalToRadixComplement(value, base)
  if (places === undefined || value < 0) {
    return result
  } else if (result.length > places) {
    return new CellError(ErrorType.NUM)
  } else {
    return padLeft(result, places)
  }
}

function decimalToBaseWithMinimumPadding(value: number, base: number, places?: number): string {
  const result = decimalToRadixComplement(value, base)
  if (places !== undefined && places > result.length) {
    return padLeft(result, places)
  } else {
    return result
  }
}

function decimalToRadixComplement(value: number, base: number): string {
  const offset = value < 0 ? Math.pow(base, NUMBER_OF_BITS) : 0
  return (value + offset).toString(base).toUpperCase()
}

function twoComplementToDecimal(value: string): number {
  const offset = (value.length == NUMBER_OF_BITS && value.startsWith('1')) ? Math.pow(2, NUMBER_OF_BITS) : 0
  return parseInt(value, 2) - offset
}
