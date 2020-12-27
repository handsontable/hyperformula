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
    return new (<any>this.constructor)(val)
  }
}

export function cloneNumber(val: ExtendedNumber, newVal: number): ExtendedNumber {
  if(typeof val === 'number') {
    return newVal
  } else {
    return val.clone(newVal)
  }
}

export class DateNumber extends RichNumber {}
export class CurrencyNumber extends RichNumber {}
export class TimeNumber extends RichNumber {}
export class DateTimeNumber extends RichNumber {}

export type ExtendedNumber = number | RichNumber

export function isExtendedNumber(val: InterpreterValue): val is ExtendedNumber {
  return (typeof val === 'number') || (val instanceof RichNumber)
}
