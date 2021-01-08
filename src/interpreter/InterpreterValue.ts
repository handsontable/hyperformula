/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {SimpleRangeValue} from './SimpleRangeValue'

export const EmptyValue = Symbol('Empty value')
export type EmptyValueType = typeof EmptyValue
export type InternalNoErrorScalarValue = RichNumber | RawNoErrorScalarValue
export type InternalScalarValue = RichNumber | RawScalarValue
export type InterpreterValue = RichNumber | RawInterpreterValue

export type RawNoErrorScalarValue = number | string | boolean | EmptyValueType
export type RawScalarValue = RawNoErrorScalarValue | CellError
export type RawInterpreterValue = RawScalarValue | SimpleRangeValue

export function getRawValue<T>(val: RichNumber | T): number | T {
  if(val instanceof RichNumber) {
    return val.get()
  } else {
    return val
  }
}

export abstract class RichNumber {
  constructor(public val: number) {}
  public get(): number {
    return this.val
  }
  public clone(val: number): this{
    return new (this.constructor as any)(val)
  }
  abstract type(): NumberType
}

export function cloneNumber(val: ExtendedNumber, newVal: number): ExtendedNumber {
  if(typeof val === 'number') {
    return newVal
  } else {
    return val.clone(newVal)
  }
}

export class DateNumber extends RichNumber {
  public type(): NumberType {
    return NumberType.Date
  }
}

export class CurrencyNumber extends RichNumber {
  public type(): NumberType {
    return NumberType.Currency
  }
}

export class TimeNumber extends RichNumber {
  public type(): NumberType {
    return NumberType.Time
  }
}

export class DateTimeNumber extends RichNumber {
  public type(): NumberType {
    return NumberType.DateTime
  }
}

export class PercentNumber extends RichNumber {
  public type(): NumberType {
    return NumberType.Percent
  }
}

export type ExtendedNumber = number | RichNumber

export function isExtendedNumber(val: any): val is ExtendedNumber {
  return (typeof val === 'number') || (val instanceof RichNumber)
}

export enum NumberType {
  Raw = 'Raw',
  Date = 'Date',
  Time = 'Time',
  DateTime = 'DateTime',
  Currency = 'Currency',
  Percent = 'Percent',
}

export function ExtendedNumberFactory(type: NumberType, value: number): ExtendedNumber {
  switch (type) {
    case NumberType.Raw:
      return value
    case NumberType.Currency:
      return new CurrencyNumber(value)
    case NumberType.Date:
      return new DateNumber(value)
    case NumberType.DateTime:
      return new DateTimeNumber(value)
    case NumberType.Time:
      return new TimeNumber(value)
    case NumberType.Percent:
      return new PercentNumber(value)
  }
}

export function getTypeOfExtendedNumber(arg: ExtendedNumber): NumberType {
  if(arg instanceof RichNumber) {
    return arg.type()
  } else {
    return NumberType.Raw
  }
}
