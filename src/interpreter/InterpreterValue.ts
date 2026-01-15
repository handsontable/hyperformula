/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {Numeric, isNumeric, NumericProvider} from '../Numeric'

/**
 * A symbol representing an empty cell value.
 */
export const EmptyValue = Symbol('Empty value')

export type EmptyValueType = typeof EmptyValue
export type InternalNoErrorScalarValue = RichNumber | RawNoErrorScalarValue
export type InternalScalarValue = RichNumber | RawScalarValue
export type InterpreterValue = RichNumber | RawInterpreterValue

/**
 * Numeric type that can be either native JS number or Numeric.
 * This allows backward compatibility while enabling precise calculations.
 */
export type NumericValue = number | Numeric

export type RawNoErrorScalarValue = NumericValue | string | boolean | EmptyValueType
export type RawScalarValue = RawNoErrorScalarValue | CellError
export type RawInterpreterValue = RawScalarValue | SimpleRangeValue

/**
 * Converts any numeric value to Numeric.
 */
export function toNumeric(val: NumericValue): Numeric {
  if (isNumeric(val)) {
    return val
  }
  return NumericProvider.getGlobalFactory().create(val)
}

/**
 * Converts any numeric value to native JS number.
 */
export function toNativeNumeric(val: NumericValue): number {
  if (typeof val === 'number') {
    return val
  }
  return val.toNumber()
}

/**
 * Converts an array of Numeric to an array of native JS numbers.
 * Useful when interfacing with functions that expect number[].
 */
export function toNativeNumerics(vals: Numeric[]): number[] {
  return vals.map(v => v.toNumber())
}

/**
 * Extracts the raw value from a RichNumber or returns the value as-is.
 * Returns Numeric for numeric values.
 */
export function getRawValue<T>(num: RichNumber | T): T extends RichNumber ? Numeric : T {
  if (num instanceof RichNumber) {
    return num.val as T extends RichNumber ? Numeric : T
  } else {
    return num as T extends RichNumber ? Numeric : T
  }
}

/**
 * Gets the raw numeric value as Numeric.
 * Converts native numbers to Numeric if needed.
 */
export function getRawPrecisionValue(num: ExtendedNumber): Numeric {
  if (num instanceof RichNumber) {
    return num.val
  } else if (isNumeric(num)) {
    return num
  } else {
    return toNumeric(num)
  }
}

/**
 * Abstract base class for numbers with additional type information.
 * Used for dates, times, currencies, percentages, etc.
 */
export abstract class RichNumber {
  public val: Numeric

  constructor(
    val: NumericValue,
    public format?: string
  ) {
    this.val = toNumeric(val)
  }

  
  /**
   *
   */
  public fromNumber(val: NumericValue): this {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return new (this.constructor as any)(val)
  }

  abstract getDetailedType(): NumberType
}

/**
 * Creates a copy of a number with a new value, preserving type information.
 */
export function cloneNumber(val: ExtendedNumber, newVal: NumericValue): ExtendedNumber {
  if (val instanceof RichNumber) {
    const ret = val.fromNumber(newVal)
    ret.format = val.format
    return ret
  } else {
    return toNumeric(newVal)
  }
}

/**
 *
 */
export class DateNumber extends RichNumber {
  
  /**
   *
   */
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_DATE
  }
}

/**
 *
 */
export class CurrencyNumber extends RichNumber {
  
  /**
   *
   */
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_CURRENCY
  }
}

/**
 *
 */
export class TimeNumber extends RichNumber {
  
  /**
   *
   */
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_TIME
  }
}

/**
 *
 */
export class DateTimeNumber extends RichNumber {
  
  /**
   *
   */
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_DATETIME
  }
}

/**
 *
 */
export class PercentNumber extends RichNumber {
  
  /**
   *
   */
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_PERCENT
  }
}

/**
 * Extended number type that can be a native JS number, Numeric, or a RichNumber.
 * This is the primary numeric type used throughout HyperFormula calculations.
 */
export type ExtendedNumber = NumericValue | RichNumber

/**
 * Type guard to check if a value is an ExtendedNumber.
 * @param {unknown} val Value to check
 * @returns {boolean} True if the value is a number, Numeric, or RichNumber
 */
export function isExtendedNumber(val: unknown): val is ExtendedNumber {
  return typeof val === 'number' || isNumeric(val) || (val instanceof RichNumber)
}

export enum NumberType {
  NUMBER_RAW = 'NUMBER_RAW',
  NUMBER_DATE = 'NUMBER_DATE',
  NUMBER_TIME = 'NUMBER_TIME',
  NUMBER_DATETIME = 'NUMBER_DATETIME',
  NUMBER_CURRENCY = 'NUMBER_CURRENCY',
  NUMBER_PERCENT = 'NUMBER_PERCENT',
}

/**
 *
 */
export function getTypeOfExtendedNumber(num: ExtendedNumber): NumberType {
  if (num instanceof RichNumber) {
    return num.getDetailedType()
  } else {
    // NumericValue (number or Numeric) is a raw number
    return NumberType.NUMBER_RAW
  }
}

export type FormatInfo = string | undefined

/**
 *
 */
export function getFormatOfExtendedNumber(num: ExtendedNumber): FormatInfo {
  if (num instanceof RichNumber) {
    return num.format
  } else {
    return undefined
  }
}

export type NumberTypeWithFormat = { type: NumberType, format?: FormatInfo }

/**
 *
 */
export function getTypeFormatOfExtendedNumber(num: ExtendedNumber): NumberTypeWithFormat {
  if (num instanceof RichNumber) {
    return {type: num.getDetailedType(), format: num.format}
  } else {
    return {type: NumberType.NUMBER_RAW}
  }
}

