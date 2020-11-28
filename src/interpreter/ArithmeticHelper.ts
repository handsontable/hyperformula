/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {
  CellError,
  CellValueTypeOrd,
  EmptyValue,
  ErrorType,
  getCellValueType,
  InternalNoErrorScalarValue,
  InternalScalarValue
} from '../Cell'
import {Config} from '../Config'
import {DateTimeHelper} from '../DateTimeHelper'
import {ErrorMessage} from '../error-message'
import {Maybe} from '../Maybe'
import {NumberLiteralHelper} from '../NumberLiteralHelper'
import {collatorFromConfig} from '../StringHelper'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'
import Collator = Intl.Collator

export type complex = [number, number]

export class ArithmeticHelper {
  private readonly collator: Collator
  private readonly actualEps: number
  constructor(
    private readonly config: Config,
    private readonly dateTimeHelper: DateTimeHelper,
    private readonly numberLiteralsHelper: NumberLiteralHelper,
  ) {
    this.collator = collatorFromConfig(config)
    this.actualEps = config.smartRounding ? config.precisionEpsilon : 0
  }

  public eqMatcherFunction(pattern: string): (arg: InterpreterValue) => boolean {
    const regexp = this.buildRegex(pattern)
    return (cellValue) => (typeof cellValue === 'string' && regexp.test(this.normalizeString(cellValue)))
  }

  public neqMatcherFunction(pattern: string): (arg: InterpreterValue) => boolean {
    const regexp = this.buildRegex(pattern)
    return (cellValue) => {
      return (typeof cellValue !== 'string' || !regexp.test(this.normalizeString(cellValue)))
    }
  }

  public searchString(pattern: string, text: string): number {
    const regexp = this.buildRegex(pattern, false)
    const result = regexp.exec(text)
    return result?.index ?? -1
  }

  public requiresRegex(pattern: string): boolean {
    if(!this.config.useRegularExpressions && !this.config.useWildcards) {
      return !this.config.matchWholeCell
    }
    for(let i=0;i<pattern.length;i++) {
      const c = pattern.charAt(i)
      if(isWildcard(c) || (this.config.useRegularExpressions && needsEscape(c))) {
        return true
      }
    }
    return false
  }

  private buildRegex(pattern: string, matchWholeCell: boolean = true): RegExp {
    pattern = this.normalizeString(pattern)
    let regexpStr
    let useWildcards = this.config.useWildcards
    let useRegularExpressions = this.config.useRegularExpressions
    if(useRegularExpressions) {
      try {
        RegExp(pattern)
      } catch (e) {
        useRegularExpressions = false
        useWildcards = false
      }
    }
    if(useRegularExpressions) {
      regexpStr = escapeNoCharacters(pattern, this.config.caseSensitive)
    } else if(useWildcards) {
      regexpStr = escapeNonWildcards(pattern, this.config.caseSensitive)
    } else {
      regexpStr = escapeAllCharacters(pattern, this.config.caseSensitive)
    }
    if(this.config.matchWholeCell && matchWholeCell) {
      return RegExp('^('+ regexpStr + ')$')
    } else {
      return RegExp(regexpStr)
    }
  }

  private normalizeString(str: string): string {
    if(!this.config.caseSensitive) {
      str = str.toLowerCase()
    }
    if(!this.config.accentSensitive) {
      str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }
    return str
  }

  public lt = (left: InternalNoErrorScalarValue, right: InternalNoErrorScalarValue): boolean => {
    return this.compare(left, right) < 0
  }

  public leq = (left: InternalNoErrorScalarValue, right: InternalNoErrorScalarValue): boolean => {
    return this.compare(left, right) <= 0
  }

  public gt = (left: InternalNoErrorScalarValue, right: InternalNoErrorScalarValue): boolean => {
    return this.compare(left, right) > 0
  }

  public geq = (left: InternalNoErrorScalarValue, right: InternalNoErrorScalarValue): boolean => {
    return this.compare(left, right) >= 0
  }

  public eq = (left: InternalNoErrorScalarValue, right: InternalNoErrorScalarValue): boolean => {
    return this.compare(left, right) === 0
  }

  public neq = (left: InternalNoErrorScalarValue, right: InternalNoErrorScalarValue): boolean => {
    return this.compare(left, right) !== 0
  }

  private compare(left: InternalNoErrorScalarValue, right: InternalNoErrorScalarValue): number {
    if (typeof left === 'string' || typeof right === 'string') {
      const leftTmp = typeof left === 'string' ? this.dateTimeHelper.dateStringToDateNumber(left) : left
      const rightTmp = typeof right === 'string' ? this.dateTimeHelper.dateStringToDateNumber(right) : right
      if (typeof leftTmp === 'number' && typeof rightTmp === 'number') {
        return this.floatCmp(leftTmp, rightTmp)
      }
    }

    if(left === EmptyValue) {
      left = coerceEmptyToValue(right)
    } else if(right === EmptyValue) {
      right = coerceEmptyToValue(left)
    }

    if ( typeof left === 'string' && typeof right === 'string') {
      return this.stringCmp(left, right)
    } else if ( typeof left === 'boolean' && typeof right === 'boolean' ) {
      return numberCmp(coerceBooleanToNumber(left), coerceBooleanToNumber(right))
    } else if ( typeof left === 'number' && typeof right === 'number' ) {
      return this.floatCmp(left, right)
    } else if ( left === EmptyValue && right === EmptyValue ) {
      return 0
    } else {
      return numberCmp(CellValueTypeOrd(getCellValueType(left)), CellValueTypeOrd(getCellValueType(right)))
    }
  }

  public floatCmp(left: number, right: number): number {
    const mod = (1 + this.actualEps)
    if ((right >= 0) && (left * mod >= right) && (left <= right * mod)) {
      return 0
    } else if ((right <= 0) && (left * mod <= right) && (left >= right * mod)) {
      return 0
    } else if (left > right) {
      return 1
    } else {
      return -1
    }
  }

  private stringCmp(left: string, right: string): number {
    return this.collator.compare(left, right)
  }

  public pow = Math.pow

  public addWithEpsilon = (left: number, right: number) => {
    const ret = left + right
    if (Math.abs(ret) < this.actualEps * Math.abs(left)) {
      return 0
    } else {
      return ret
    }
  }

  public unaryMinus = (arg: number): number => {
    return -arg
  }

  public unaryPlus = (arg: number): number => {
    return arg
  }

  public unaryPercent = (arg: number): number => {
    return arg/100
  }

  public concat = (left: string, right: string): string => {
    return left.concat(right)
  }
  /**
   * Adds two numbers
   *
   * Implementation of adding which is used in interpreter.
   *
   * @param left - left operand of addition
   * @param right - right operand of addition
   */
  public nonstrictadd = (left: InternalScalarValue, right: InternalScalarValue): number | CellError => {
    if (left instanceof CellError) {
      return left
    } else if (right instanceof CellError) {
      return right
    } else if (typeof left === 'number') {
      if (typeof right === 'number') {
        return this.addWithEpsilon(left, right)
      } else {
        return left
      }
    } else if (typeof right === 'number') {
      return right
    } else {
      return 0
    }
  }

  /**
   * Subtracts two numbers
   *
   * Implementation of subtracting which is used in interpreter.
   *
   * @param left - left operand of subtraction
   * @param right - right operand of subtraction
   * @param eps - precision of comparison
   */
  public subtract = (left: number, right: number) => {
    const ret = left - right
    if (Math.abs(ret) < this.actualEps * Math.abs(left)) {
      return 0
    } else {
      return ret
    }
  }

  public divide = (left: number, right: number): number | CellError => {
    if (right === 0) {
      return new CellError(ErrorType.DIV_BY_ZERO)
    } else {
      return (left / right)
    }
  }

  public multiply = (left: number, right: number): number => {
    return left*right
  }

  public coerceScalarToNumberOrError(arg: InternalScalarValue): number | CellError {
    if (arg instanceof CellError) {
      return arg
    }
    return this.coerceToMaybeNumber(arg) ?? new CellError(ErrorType.VALUE, ErrorMessage.NumberCoercion)
  }

  public coerceToMaybeNumber(arg: InternalScalarValue): Maybe<number> {
    return this.coerceNonDateScalarToMaybeNumber(arg) ?? (
      typeof arg === 'string' ? this.dateTimeHelper.dateStringToDateNumber(arg) : undefined
    )
  }

  public coerceNonDateScalarToMaybeNumber(arg: InternalScalarValue): Maybe<number> {
    if (arg === EmptyValue) {
      return 0
    } else if (typeof arg === 'string') {
      if(arg === '') {
        return 0
      }
      return this.numberLiteralsHelper.numericStringToMaybeNumber(arg.trim())
    } else {
      const coercedNumber = Number(arg)
      if (isNaN(coercedNumber)) {
        return undefined
      } else {
        return coercedNumber
      }
    }
  }

  public coerceNumbersExactRanges = (args: InterpreterValue[]): number[] | CellError =>  this.manyToNumbers(args, this.manyToExactNumbers)

  public coerceNumbersCoerceRangesDropNulls = (args: InterpreterValue[]): number[] | CellError =>  this.manyToNumbers(args, this.manyToCoercedNumbersDropNulls)

  private manyToNumbers(args: InterpreterValue[], rangeFn: (args: InternalScalarValue[]) => number[] | CellError): number[] | CellError {
    const vals: (number | SimpleRangeValue)[] = []
    for(const arg of args) {
      if(arg instanceof SimpleRangeValue) {
        vals.push(arg)
      } else {
        const coerced = this.coerceScalarToNumberOrError(arg)
        if(coerced instanceof CellError) {
          return coerced
        } else {
          vals.push(coerced)
        }
      }
    }
    const expandedVals: number[] = []
    for(const val of vals) {
      if(val instanceof SimpleRangeValue) {
        const arr = rangeFn(val.valuesFromTopLeftCorner())
        if(arr instanceof CellError) {
          return arr
        } else {
          expandedVals.push(...arr)
        }
      } else {
        expandedVals.push(val)
      }
    }
    return expandedVals
  }

  public manyToExactNumbers = (args: InternalScalarValue[]): number[] | CellError => {
    const ret: number[] = []
    for(const arg of args) {
      if(arg instanceof CellError) {
        return arg
      } else if (typeof arg === 'number') {
        ret.push(arg)
      }
    }
    return ret
  }

  public manyToOnlyNumbersDropNulls = (args: InternalScalarValue[]): number[] | CellError => {
    const ret: number[] = []
    for(const arg of args) {
      if(arg instanceof CellError) {
        return arg
      } else if(arg === EmptyValue) {
        continue
      } else if (typeof arg === 'number') {
        ret.push(arg)
      } else {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberExpected)
      }
    }
    return ret
  }

  public manyToCoercedNumbersDropNulls = (args: InternalScalarValue[]): number[] | CellError => {
    const ret: number[] = []
    for(const arg of args) {
      if(arg instanceof CellError) {
        return arg
      }
      if(arg === EmptyValue) {
        continue
      }
      const coerced = this.coerceScalarToNumberOrError(arg)
      if (typeof coerced === 'number') {
        ret.push(coerced)
      }
    }
    return ret
  }

  public coerceScalarToComplex(arg: InternalScalarValue): complex | CellError {
    if(arg instanceof CellError) {
      return arg
    } else if(arg === EmptyValue) {
      return [0, 0]
    } else if(typeof arg === 'number') {
      return [arg, 0]
    } else if(typeof arg === 'string') {
      return this.coerceStringToComplex(arg)
    } else {
      return new CellError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected)
    }
  }

  private coerceStringToComplex(arg: string): complex | CellError {
    const regexp = /^\s*([+-]?)\s*(([\d\.,]+(e[+-]?\d+)?)\s*([ij]?)|([ij]))\s*(([+-])\s*([+-]?)\s*(([\d\.,]+(e[+-]?\d+)?)\s*([ij]?)|([ij])))?$/g

    const match = regexp.exec(arg)
    if(match === null) {
      return new CellError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected)
    }

    let val1
    if(match[6]!==undefined) {
      val1 = (match[1]==='-'?[0, -1]:[0, 1]) as complex
    } else {
      val1 = this.parseComplexToken(match[1] + match[3], match[5])
    }

    if(val1 instanceof CellError) {
      return val1
    }

    if(match[8] === undefined) {
      return val1
    }

    let val2
    if(match[14]!==undefined) {
      val2 = (match[9]==='-'?[0, -1]:[0, 1]) as complex
    } else {
      val2 = this.parseComplexToken(match[9] + match[11], match[13])
    }
    if(val2 instanceof CellError) {
      return val2
    }
    if((match[5]!=='') || (match[13]==='')) {
      return new CellError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected)
    }

    if(match[8] === '+') {
      return [val1[0]+val2[0], val1[1]+val2[1]]
    } else {
      return [val1[0]-val2[0], val1[1]-val2[1]]
    }
  }

  private parseComplexToken(arg: string, mod: string): complex | CellError {
    const val = this.coerceNonDateScalarToMaybeNumber(arg)
    if(val === undefined) {
      return new CellError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected)
    }
    if(mod === '') {
      return [val, 0]
    } else {
      return [0, val]
    }
  }
}

export function coerceComplexToString([re, im]: complex, symb: string): string {
  if(im===0) {
    return re.toString()
  }
  if(re===0) {
    if(im===1) {
      return symb
    } else if(im===-1) {
      return '-'+symb
    } else {
      return im.toString() + symb
    }
  }
  if(im===1) {
    return re.toString()+'+'+symb
  } else if(im===-1) {
    return re.toString()+'-'+symb
  } else if(im>0) {
    return re.toString()+'+'+im.toString()+symb
  } else {
    return re.toString()+im.toString()+symb
  }
}

export function coerceToRange(arg: InterpreterValue): SimpleRangeValue {
  if (arg instanceof SimpleRangeValue) {
    return arg
  } else {
    return SimpleRangeValue.fromScalar(arg)
  }
}

export function coerceToRangeNumbersOrError(arg: InterpreterValue): SimpleRangeValue | CellError | null {
  if ((arg instanceof SimpleRangeValue && arg.hasOnlyNumbers()) || arg instanceof CellError) {
    return arg
  } else if (typeof arg === 'number') {
    return SimpleRangeValue.fromScalar(arg)
  } else {
    return null
  }
}

export function coerceBooleanToNumber(arg: boolean): number {
  return Number(arg)
}

export function coerceEmptyToValue(arg: InternalNoErrorScalarValue): InternalNoErrorScalarValue {
  if (typeof arg === 'string') {
    return ''
  } else if (typeof arg === 'number') {
    return 0
  } else if (typeof arg === 'boolean') {
    return false
  } else {
    return EmptyValue
  }
}

/**
 * Coerce scalar value to boolean if possible, or error if value is an error
 *
 * @param arg
 */
export function coerceScalarToBoolean(arg: InternalScalarValue): boolean | CellError | undefined {
  if (arg instanceof CellError || typeof arg === 'boolean') {
    return arg
  } else if (arg === EmptyValue) {
    return false
  } else if (typeof arg === 'number') {
    return arg !== 0
  } else {
    const argUppered = arg.toUpperCase()
    if (argUppered === 'TRUE') {
      return true
    } else if (argUppered === 'FALSE') {
      return false
    } else if (argUppered === '') {
      return false
    } else {
      return undefined
    }
  }
}

export function coerceScalarToString(arg: InternalScalarValue): string | CellError {
  if (arg instanceof CellError || typeof arg === 'string') {
    return arg
  } else if (arg === EmptyValue) {
    return ''
  } else if (typeof arg === 'number') {
    return arg.toString()
  } else {
    return arg ? 'TRUE' : 'FALSE'
  }
}

export function zeroIfEmpty(arg: InternalNoErrorScalarValue): InternalNoErrorScalarValue {
  return arg === EmptyValue ? 0 : arg
}

export function numberCmp(left: number, right: number): number {
  if (left > right) {
    return 1
  } else if (left < right) {
    return -1
  } else {
    return 0
  }
}

export function isNumberOverflow(arg: number): boolean {
  return (isNaN(arg) || arg === Infinity || arg === -Infinity)
}

export function fixNegativeZero(arg: number): number {
  if (arg === 0) {
    return 0
  } else {
    return arg
  }
}

function isWildcard(c: string): boolean {
  return ['*', '?'].includes(c)
}

const escapedCharacters = ['{', '}', '[', ']', '(', ')', '<', '>', '=', '.', '+', '-', ',', '\\', '$', '^', '!']

function needsEscape(c: string): boolean {
  return escapedCharacters.includes(c)
}

function escapeNonWildcards(pattern: string, caseSensitive: boolean): string {
  let str = ''
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern.charAt(i)
    if (c === '~') {
      if (i == pattern.length - 1) {
        str += '~'
        continue
      }
      const d = pattern.charAt(i + 1)
      if (isWildcard(d) || needsEscape(d)) {
        str += '\\' + d
        i++
      } else {
        str += d
        i++
      }
    } else if (isWildcard(c)) {
      str += '.' + c
    } else if (needsEscape(c)) {
      str += '\\' + c
    } else if(caseSensitive) {
      str += c
    } else {
      str += c.toLowerCase()
    }
  }
  return str
}

function escapeAllCharacters(pattern: string, caseSensitive: boolean): string {
  let str = ''
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern.charAt(i)
    if(isWildcard(c) || needsEscape(c)) {
      str += '\\' + c
    } else if(caseSensitive) {
      str += c
    } else {
      str += c.toLowerCase()
    }
  }
  return str
}

function escapeNoCharacters(pattern: string, caseSensitive: boolean): string {
  let str = ''
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern.charAt(i)
    if(isWildcard(c) || needsEscape(c)) {
      str += c
    } else if(caseSensitive) {
      str += c
    } else {
      str += c.toLowerCase()
    }
  }
  return str
}
