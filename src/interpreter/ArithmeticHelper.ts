/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {
  CellError,
  CellValueTypeOrd,
  ErrorType,
  getCellValueType
} from '../Cell'
import {Config} from '../Config'
import {DateTimeHelper} from '../DateTimeHelper'
import {ErrorMessage} from '../error-message'
import {Maybe} from '../Maybe'
import {NumberLiteralHelper} from '../NumberLiteralHelper'
import {collatorFromConfig} from '../StringHelper'
import {
  EmptyValue, ExtendedBoolean, ExtendedNumber, ExtendedString, getRawNoErrorValue, getRawScalarValue,
  InternalNoErrorScalarValue,
  InternalScalarValue,
  InterpreterValue, RawNoErrorScalarValue, RegularNumber
} from './InterpreterValue'
import {SimpleRangeValue} from './SimpleRangeValue'
import Collator = Intl.Collator

export type complex = [number, number]

const COMPLEX_NUMBER_SYMBOL = 'i'
const complexParsingRegexp = /^\s*([+-]?)\s*(([\d\.,]+(e[+-]?\d+)?)\s*([ij]?)|([ij]))\s*(([+-])\s*([+-]?)\s*(([\d\.,]+(e[+-]?\d+)?)\s*([ij]?)|([ij])))?$/


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
    return (cellValue) => (cellValue instanceof ExtendedString && regexp.test(this.normalizeString(cellValue.get())))
  }

  public neqMatcherFunction(pattern: string): (arg: InterpreterValue) => boolean {
    const regexp = this.buildRegex(pattern)
    return (cellValue) => {
      return (!(cellValue instanceof ExtendedString) || !regexp.test(this.normalizeString(cellValue.get())))
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
    if (left instanceof ExtendedString || right instanceof ExtendedString) {
      const leftTmp = left instanceof ExtendedString ? this.dateTimeHelper.dateStringToDateNumber(left.get()) : left
      const rightTmp = right instanceof ExtendedString ? this.dateTimeHelper.dateStringToDateNumber(right.get()) : right
      if (leftTmp instanceof ExtendedNumber && rightTmp instanceof ExtendedNumber) {
        return this.floatCmp(leftTmp, rightTmp)
      }
    }

    if(left === EmptyValue) {
      left = coerceEmptyToValue(right)
    } else if(right === EmptyValue) {
      right = coerceEmptyToValue(left)
    }

    if ( left instanceof ExtendedString && right instanceof ExtendedString ) {
      return this.stringCmp(left.get(), right.get())
    } else if ( left instanceof ExtendedBoolean && right instanceof ExtendedBoolean ) {
      return numberCmp(coerceBooleanToNumber(left).get(), coerceBooleanToNumber(right).get())
    } else if ( left instanceof ExtendedNumber && right instanceof ExtendedNumber ) {
      return this.floatCmp(left, right)
    } else if ( left === EmptyValue && right === EmptyValue ) {
      return 0
    } else {
      return numberCmp(CellValueTypeOrd(getCellValueType(left)), CellValueTypeOrd(getCellValueType(right)))
    }
  }

  public floatCmp(leftArg: ExtendedNumber, rightArg: ExtendedNumber): number {
    const left = leftArg.get()
    const right = rightArg.get()
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

  //FIXME
  public addWithEpsilon = (leftArg: ExtendedNumber, rightArg: ExtendedNumber) => {
    const left = leftArg.get()
    const right = rightArg.get()
    const ret = left + right
    if (Math.abs(ret) < this.actualEps * Math.abs(left)) {
      return new RegularNumber(0)
    } else {
      return new RegularNumber(ret)
    }
  }

  //FIXME
  public unaryMinus = (arg: ExtendedNumber): ExtendedNumber => {
    return new RegularNumber(-arg.get())
  }

  public unaryPlus = (arg: ExtendedNumber): ExtendedNumber => {
    return arg
  }

  //FIXME
  public unaryPercent = (arg: ExtendedNumber): ExtendedNumber => {
    return new RegularNumber(arg.get()/100)
  }

  public concat = (left: ExtendedString, right: ExtendedString): ExtendedString => {
    return new ExtendedString(left.get().concat(right.get()))
  }
  /**
   * Adds two numbers
   *
   * Implementation of adding which is used in interpreter.
   *
   * @param left - left operand of addition
   * @param right - right operand of addition
   */
  public nonstrictadd = (left: InternalScalarValue, right: InternalScalarValue): ExtendedNumber | CellError => {
    if (left instanceof CellError) {
      return left
    } else if (right instanceof CellError) {
      return right
    } else if (left instanceof ExtendedNumber) {
      if (right instanceof ExtendedNumber) {
        return this.addWithEpsilon(left, right)
      } else {
        return left
      }
    } else if (right instanceof ExtendedNumber) {
      return right
    } else {
      return new RegularNumber(0)
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
  public subtract = (leftArg: ExtendedNumber, rightArg: ExtendedNumber) => {
    const left = leftArg.get()
    const right = rightArg.get()
    const ret = left - right
    if (Math.abs(ret) < this.actualEps * Math.abs(left)) {
      return new RegularNumber(0)
    } else {
      return new RegularNumber(ret)
    }
  }

  public divide = (leftArg: ExtendedNumber, rightArg: ExtendedNumber): ExtendedNumber | CellError => {
    const left = leftArg.get()
    const right = rightArg.get()
    if (right === 0) {
      return new CellError(ErrorType.DIV_BY_ZERO)
    } else {
      return new RegularNumber(left / right)
    }
  }

  public multiply = (left: ExtendedNumber, right: ExtendedNumber): ExtendedNumber => {
    return new RegularNumber(left.get()*right.get())
  }

  public coerceScalarToNumberOrError(arg: InternalScalarValue): ExtendedNumber | CellError {
    if (arg instanceof CellError) {
      return arg
    }
    return this.coerceToMaybeNumber(arg) ?? new CellError(ErrorType.VALUE, ErrorMessage.NumberCoercion)
  }

  public coerceToMaybeNumber(arg: InternalScalarValue): Maybe<ExtendedNumber> {
    return this.coerceNonDateScalarToMaybeNumber(arg) ?? (
      arg instanceof ExtendedString ? this.dateTimeHelper.dateStringToDateNumber(arg.get()) : undefined
    )
  }

  public coerceNonDateScalarToMaybeNumber(arg: InternalScalarValue): Maybe<ExtendedNumber> {
    if (arg === EmptyValue) {
      return new RegularNumber(0)
    } else if (arg instanceof ExtendedString) {
      if(arg.get() === '') {
        return new RegularNumber(0)
      }
      const val = this.numberLiteralsHelper.numericStringToMaybeNumber(arg.get().trim())
      if(val===undefined) {
        return undefined
      }
      return new RegularNumber(val)
    } else {
      const coercedNumber = Number(getRawScalarValue(arg))
      if (isNaN(coercedNumber)) {
        return undefined
      } else {
        return new RegularNumber(coercedNumber)
      }
    }
  }

  public coerceComplexExactRanges(args: InterpreterValue[]): complex[] | CellError {
    const vals: (complex | SimpleRangeValue)[] = []
    for(const arg of args) {
      if(arg instanceof SimpleRangeValue) {
        vals.push(arg)
      } else if(arg !== EmptyValue) {
        const coerced = this.coerceScalarToComplex(arg)
        if(coerced instanceof CellError) {
          return coerced
        } else {
          vals.push(coerced)
        }
      }
    }
    const expandedVals: complex[] = []
    for(const val of vals) {
      if(val instanceof SimpleRangeValue) {
        const arr = this.manyToExactComplex(val.valuesFromTopLeftCorner())
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

  public manyToExactComplex = (args: InternalScalarValue[]): complex[] | CellError => {
    const ret: complex[] = []
    for(const arg of args) {
      if(arg instanceof CellError) {
        return arg
      } else if (arg instanceof ExtendedNumber || arg instanceof ExtendedString) {
        const coerced = this.coerceScalarToComplex(arg)
        if(!(coerced instanceof CellError)) {
          ret.push(coerced)
        }
      }
    }
    return ret
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
          vals.push(coerced.get())
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
      } else if (arg instanceof ExtendedNumber) {
        ret.push(arg.get())
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
      } else if (arg instanceof ExtendedNumber) {
        ret.push(arg.get())
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
      if (coerced instanceof ExtendedNumber) {
        ret.push(coerced.get())
      }
    }
    return ret
  }

  public coerceScalarToComplex(arg: InternalScalarValue): complex | CellError {
    if(arg instanceof CellError) {
      return arg
    } else if(arg === EmptyValue) {
      return [0, 0]
    } else if(arg instanceof ExtendedNumber) {
      return [arg.get(), 0]
    } else if(arg instanceof ExtendedString) {
      return this.coerceStringToComplex(arg.get())
    } else {
      return new CellError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected)
    }
  }

  private coerceStringToComplex(arg: string): complex | CellError {
    const match = complexParsingRegexp.exec(arg)
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
    const val = this.coerceNonDateScalarToMaybeNumber(new ExtendedString(arg))
    if(val === undefined) {
      return new CellError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected)
    }
    if(mod === '') {
      return [val.get(), 0]
    } else {
      return [0, val.get()]
    }
  }
}

export function coerceComplexToString([re, im]: complex, symb?: string): string | CellError {
  if(!isFinite(re) || !isFinite(im)) {
    return new CellError(ErrorType.NUM, ErrorMessage.NaN)
  }
  symb = symb ?? COMPLEX_NUMBER_SYMBOL
  if(im===0) {
    return `${re}`
  }
  const imStr = `${im === -1 || im === 1 ? '' : Math.abs(im)}${symb}`
  if(re===0) {
    return `${im < 0 ? '-' : ''}${imStr}`
  }
  return `${re}${im < 0 ? '-' : '+'}${imStr}`
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
  } else if (arg instanceof ExtendedNumber) {
    return SimpleRangeValue.fromScalar(arg)
  } else {
    return null
  }
}

export function coerceBooleanToNumber(arg: ExtendedBoolean): ExtendedNumber {
  return new RegularNumber(Number(arg.get()))
}

export function coerceEmptyToValue(arg: InternalNoErrorScalarValue): InternalNoErrorScalarValue {
  if (arg instanceof ExtendedString) {
    return new ExtendedString('')
  } else if (arg instanceof ExtendedNumber) {
    return new RegularNumber(0)
  } else if (arg instanceof ExtendedBoolean) {
    return new ExtendedBoolean(false)
  } else {
    return EmptyValue
  }
}

/**
 * Coerce scalar value to boolean if possible, or error if value is an error
 *
 * @param arg
 */
export function coerceScalarToBoolean(arg: InternalScalarValue): ExtendedBoolean | CellError | undefined {
  if (arg instanceof CellError || arg instanceof ExtendedBoolean) {
    return arg
  } else if (arg === EmptyValue) {
    return new ExtendedBoolean(false)
  } else if (arg instanceof ExtendedNumber) {
    return new ExtendedBoolean(arg.get() !== 0)
  } else {
    const argUppered = arg.get().toUpperCase()
    if (argUppered === 'TRUE') {
      return new ExtendedBoolean(true)
    } else if (argUppered === 'FALSE') {
      return new ExtendedBoolean(false)
    } else if (argUppered === '') {
      return new ExtendedBoolean(false)
    } else {
      return undefined
    }
  }
}

export function coerceScalarToString(arg: InternalScalarValue): ExtendedString | CellError {
  if (arg instanceof CellError || arg instanceof ExtendedString) {
    return arg
  } else if (arg === EmptyValue) {
    return new ExtendedString('')
  } else if (arg instanceof ExtendedNumber) {
    return new ExtendedString(arg.get().toString())
  } else {
    return new ExtendedString(arg.get() ? 'TRUE' : 'FALSE')
  }
}

export function zeroIfEmpty(arg: RawNoErrorScalarValue): RawNoErrorScalarValue {
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
