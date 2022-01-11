/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {padLeft} from '../../format/format'
import {Maybe} from '../../Maybe'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

const MAX_LENGTH = 10
const DECIMAL_NUMBER_OF_BITS = 255
const MIN_BASE = 2
const MAX_BASE = 36
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export class RadixConversionPlugin extends FunctionPlugin implements FunctionPluginTypecheck<RadixConversionPlugin> {
  public static implementedFunctions = {
    'DEC2BIN': {
      method: 'dec2bin',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 1, maxValue: 10},
      ],
    },
    'DEC2OCT': {
      method: 'dec2oct',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 1, maxValue: 10},
      ],
    },
    'DEC2HEX': {
      method: 'dec2hex',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 1, maxValue: 10},
      ],
    },
    'BIN2DEC': {
      method: 'bin2dec',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ],
    },
    'BIN2OCT': {
      method: 'bin2oct',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: MAX_LENGTH},
      ],
    },
    'BIN2HEX': {
      method: 'bin2hex',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: MAX_LENGTH},
      ],
    },
    'OCT2DEC': {
      method: 'oct2dec',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ],
    },
    'OCT2BIN': {
      method: 'oct2bin',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: MAX_LENGTH},
      ],
    },
    'OCT2HEX': {
      method: 'oct2hex',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: MAX_LENGTH},
      ],
    },
    'HEX2DEC': {
      method: 'hex2dec',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ],
    },
    'HEX2BIN': {
      method: 'hex2bin',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: MAX_LENGTH},
      ],
    },
    'HEX2OCT': {
      method: 'hex2oct',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: MAX_LENGTH},
      ],
    },
    'DECIMAL': {
      method: 'decimal',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, minValue: MIN_BASE, maxValue: MAX_BASE},
      ],
    },
    'BASE': {
      method: 'base',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: MIN_BASE, maxValue: MAX_BASE},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: DECIMAL_NUMBER_OF_BITS},
      ],
    },
  }

  public dec2bin(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DEC2BIN'),
      (value, places) => decimalToBaseWithExactPadding(value, 2, places)
    )
  }

  public dec2oct(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DEC2OCT'),
      (value, places) => decimalToBaseWithExactPadding(value, 8, places)
    )
  }

  public dec2hex(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DEC2HEX'),
      (value, places) => decimalToBaseWithExactPadding(value, 16, places)
    )
  }

  public bin2dec(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BIN2DEC'), (binary) => {
      const binaryWithSign = coerceStringToBase(binary, 2, MAX_LENGTH)
      if (binaryWithSign === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotBinary)
      }
      return twoComplementToDecimal(binaryWithSign, 2)
    })
  }

  public bin2oct(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BIN2OCT'), (binary, places) => {
      const binaryWithSign = coerceStringToBase(binary, 2, MAX_LENGTH)
      if (binaryWithSign === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotBinary)
      }
      return decimalToBaseWithExactPadding(twoComplementToDecimal(binaryWithSign, 2), 8, places)
    })
  }

  public bin2hex(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BIN2HEX'), (binary, places) => {
      const binaryWithSign = coerceStringToBase(binary, 2, MAX_LENGTH)
      if (binaryWithSign === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotBinary)
      }
      return decimalToBaseWithExactPadding(twoComplementToDecimal(binaryWithSign, 2), 16, places)
    })
  }

  public oct2dec(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('OCT2DEC'), (octal) => {
      const octalWithSign = coerceStringToBase(octal, 8, MAX_LENGTH)
      if (octalWithSign === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotOctal)
      }
      return twoComplementToDecimal(octalWithSign, 8)
    })
  }

  public oct2bin(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('OCT2BIN'), (octal, places) => {
      const octalWithSign = coerceStringToBase(octal, 8, MAX_LENGTH)
      if (octalWithSign === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotOctal)
      }
      return decimalToBaseWithExactPadding(twoComplementToDecimal(octalWithSign, 8), 2, places)
    })
  }

  public oct2hex(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('OCT2HEX'), (octal, places) => {
      const octalWithSign = coerceStringToBase(octal, 8, MAX_LENGTH)
      if (octalWithSign === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotOctal)
      }
      return decimalToBaseWithExactPadding(twoComplementToDecimal(octalWithSign, 8), 16, places)
    })
  }

  public hex2dec(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HEX2DEC'), (hexadecimal) => {
      const hexadecimalWithSign = coerceStringToBase(hexadecimal, 16, MAX_LENGTH)
      if (hexadecimalWithSign === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotHex)
      }
      return twoComplementToDecimal(hexadecimalWithSign, 16)
    })
  }

  public hex2bin(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HEX2BIN'), (hexadecimal, places) => {
      const hexadecimalWithSign = coerceStringToBase(hexadecimal, 16, MAX_LENGTH)
      if (hexadecimalWithSign === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotHex)
      }
      return decimalToBaseWithExactPadding(twoComplementToDecimal(hexadecimalWithSign, 16), 2, places)
    })
  }

  public hex2oct(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HEX2OCT'), (hexadecimal, places) => {
      const hexadecimalWithSign = coerceStringToBase(hexadecimal, 16, MAX_LENGTH)
      if (hexadecimalWithSign === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotHex)
      }
      return decimalToBaseWithExactPadding(twoComplementToDecimal(hexadecimalWithSign, 16), 8, places)
    })
  }

  public base(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BASE'), decimalToBaseWithMinimumPadding)
  }

  public decimal(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DECIMAL'), (arg, base) => {
      const input = coerceStringToBase(arg, base, DECIMAL_NUMBER_OF_BITS)
      if (input === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.NotHex)
      }
      return parseInt(input, base)
    })
  }
}

function coerceStringToBase(value: string, base: number, maxLength: number): Maybe<string> {
  const baseAlphabet = ALPHABET.substr(0, base)
  const regex = new RegExp(`^[${baseAlphabet}]+$`)
  if (value.length > maxLength || !regex.test(value)) {
    return undefined
  }
  return value
}

function decimalToBaseWithExactPadding(value: number, base: number, places?: number): string | CellError {
  if (value > maxValFromBase(base)) {
    return new CellError(ErrorType.NUM, ErrorMessage.ValueBaseLarge)
  }
  if (value < minValFromBase(base)) {
    return new CellError(ErrorType.NUM, ErrorMessage.ValueBaseSmall)
  }
  const result = decimalToRadixComplement(value, base)
  if (places === undefined || value < 0) {
    return result
  } else if (result.length > places) {
    return new CellError(ErrorType.NUM, ErrorMessage.ValueBaseLong)
  } else {
    return padLeft(result, places)
  }
}

function minValFromBase(base: number) {
  return -Math.pow(base, MAX_LENGTH) / 2
}

function maxValFromBase(base: number) {
  return -minValFromBase(base) - 1
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
  const offset = value < 0 ? Math.pow(base, MAX_LENGTH) : 0
  return (value + offset).toString(base).toUpperCase()
}

function twoComplementToDecimal(value: string, base: number): number {
  const parsed = parseInt(value, base)
  const offset = Math.pow(base, MAX_LENGTH)
  return (parsed >= offset / 2) ? parsed - offset : parsed
}
