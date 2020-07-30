/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {padLeft} from '../../format/format'
import {Maybe} from '../../Maybe'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

const NUMBER_OF_BITS = 10
const DECIMAL_NUMBER_OF_BITS = 255
const MIN_BASE = 2
const MAX_BASE = 36
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export class RadixConversionPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'DEC2BIN': {
      method: 'dec2bin',
      parameters: { list: [
        { argumentType: ArgumentTypes.NUMBER, minValue: minValFromBase(2), maxValue: maxValFromBase(2) },
        { argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 1, maxValue: 10 },
      ]},
    },
    'DEC2OCT': {
      method: 'dec2oct',
      parameters: { list: [
        { argumentType: ArgumentTypes.NUMBER, minValue: minValFromBase(8), maxValue: maxValFromBase(8) },
        { argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 1, maxValue: 10 },
      ]},
    },
    'DEC2HEX': {
      method: 'dec2hex',
      parameters: { list: [
        { argumentType: ArgumentTypes.NUMBER, minValue: minValFromBase(16), maxValue: maxValFromBase(16) },
        { argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 1, maxValue: 10 },
      ]},
    },
    'BIN2DEC': {
      method: 'bin2dec',
      parameters: { list: [
        { argumentType: ArgumentTypes.STRING }
      ]},
    },
    'BIN2OCT': {
      method: 'bin2oct',
      parameters: { list: [
        { argumentType: ArgumentTypes.STRING },
        { argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: DECIMAL_NUMBER_OF_BITS},
      ]},
    },
    'BIN2HEX': {
      method: 'bin2hex',
      parameters: { list: [
        { argumentType: ArgumentTypes.STRING },
        { argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: DECIMAL_NUMBER_OF_BITS},
      ]},
    },
    'DECIMAL': {
      method: 'decimal',
      parameters: { list: [
        { argumentType: ArgumentTypes.STRING },
        { argumentType: ArgumentTypes.NUMBER, minValue: MIN_BASE, maxValue: MAX_BASE },
      ]},
    },
    'BASE': {
      method: 'base',
      parameters: { list: [
        { argumentType: ArgumentTypes.NUMBER, minValue: 0 },
        { argumentType: ArgumentTypes.NUMBER, minValue: MIN_BASE, maxValue: MAX_BASE },
        { argumentType: ArgumentTypes.NUMBER, optionalArg: true, minValue: 0, maxValue: DECIMAL_NUMBER_OF_BITS},
      ]},
    },
  }

  public dec2bin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('DEC2BIN'),
      (value, places) => decimalToBaseWithExactPadding(value, 2, places)
    )
  }

  public dec2oct(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('DEC2OCT'),
      (value, places) => decimalToBaseWithExactPadding(value, 8, places)
    )
  }

  public dec2hex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('DEC2HEX'),
      (value, places) => decimalToBaseWithExactPadding(value, 16, places)
    )
  }

  public bin2dec(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('BIN2DEC'), (binary) => {
        const binaryWithSign = coerceStringToBase(binary, 2, NUMBER_OF_BITS)
        if(binaryWithSign === undefined) {
          return new CellError(ErrorType.NUM)
        }
        return twoComplementToDecimal(binaryWithSign)
      })
  }

  public bin2oct(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('BIN2OCT'), (binary, places) => {
      const binaryWithSign = coerceStringToBase(binary, 2, NUMBER_OF_BITS)
      if(binaryWithSign === undefined) {
        return new CellError(ErrorType.NUM)
      }
      return decimalToBaseWithExactPadding(twoComplementToDecimal(binaryWithSign), 8, places)
    })
  }

  public bin2hex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('BIN2HEX'), (binary, places) => {
      const binaryWithSign = coerceStringToBase(binary, 2, NUMBER_OF_BITS)
      if(binaryWithSign === undefined) {
        return new CellError(ErrorType.NUM)
      }
      return decimalToBaseWithExactPadding(twoComplementToDecimal(binaryWithSign), 16, places)
    })
  }

  public base(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('BASE'), decimalToBaseWithMinimumPadding)
  }

  public decimal(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('DECIMAL'), (arg, base) => {
      const input = coerceStringToBase(arg, base, DECIMAL_NUMBER_OF_BITS)
      if(input === undefined) {
        return new CellError(ErrorType.NUM)
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
  const result = decimalToRadixComplement(value, base)
  if (places === undefined || value < 0) {
    return result
  } else if (result.length > places) {
    return new CellError(ErrorType.NUM)
  } else {
    return padLeft(result, places)
  }
}

function minValFromBase(base: number) {
  return -Math.pow(base, NUMBER_OF_BITS) / 2
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
  const offset = value < 0 ? Math.pow(base, NUMBER_OF_BITS) : 0
  return (value + offset).toString(base).toUpperCase()
}

function twoComplementToDecimal(value: string): number {
  const offset = (value.length == NUMBER_OF_BITS && value.startsWith('1')) ? Math.pow(2, NUMBER_OF_BITS) : 0
  return parseInt(value, 2) - offset
}
