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
    return val.getRawValue()
  } else {
    return val
  }
}

export abstract class RichNumber {
  constructor(public val: number) {}
  public getRawValue(): number {
    return this.val
  }
  public clone(val: number): this{
    return new (this.constructor as any)(val)
  }
  abstract getDetailedType(): NumberType
}

export function cloneNumber(val: ExtendedNumber, newVal: number): ExtendedNumber {
  if(typeof val === 'number') {
    return newVal
  } else {
    return val.clone(newVal)
  }
}

export class DateNumber extends RichNumber {
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_DATE
  }
}

export class CurrencyNumber extends RichNumber {
  constructor(public val: number,
              public currency?: string) {
    super(val)
  }
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_CURRENCY
  }
}

export class TimeNumber extends RichNumber {
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_TIME
  }
}

export class DateTimeNumber extends RichNumber {
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_DATETIME
  }
}

export class PercentNumber extends RichNumber {
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_PERCENT
  }
}

export type ExtendedNumber = number | RichNumber

export function isExtendedNumber(val: any): val is ExtendedNumber {
  return (typeof val === 'number') || (val instanceof RichNumber)
}

export enum NumberType {
  NUMBER_RAW = 'NUMBER_RAW',
  NUMBER_DATE = 'NUMBER_DATE',
  NUMBER_TIME = 'NUMBER_TIME',
  NUMBER_DATETIME = 'NUMBER_DATETIME',
  NUMBER_CURRENCY = 'NUMBER_CURRENCY',
  NUMBER_PERCENT = 'NUMBER_PERCENT',
}

export function getTypeOfExtendedNumber(arg: ExtendedNumber): NumberType {
  if(arg instanceof RichNumber) {
    return arg.getDetailedType()
  } else {
    return NumberType.NUMBER_RAW
  }
}
