/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {SimpleRangeValue} from './SimpleRangeValue'

export const EmptyValue = Symbol('Empty value')
export type EmptyValueType = typeof EmptyValue
export type InternalNoErrorScalarValue = ExtendedNumber | ExtendedString | ExtendedBoolean | EmptyValueType
export type InternalScalarValue = InternalNoErrorScalarValue | CellError
export type InterpreterValue = InternalScalarValue | SimpleRangeValue

export type RawNoErrorScalarValue = number | string | boolean | EmptyValueType
export type RawScalarValue = RawNoErrorScalarValue | CellError
export type RawInterpreterValue = RawScalarValue | SimpleRangeValue

export function getRawValue<T>(val: ExtendedNumber | ExtendedString | ExtendedBoolean | T): number | string | boolean | T {
  if(val instanceof ExtendedNumber || val instanceof ExtendedBoolean || val instanceof ExtendedString) {
    return val.get()
  } else {
    return val
  }
}


export function putRawValue<T>(val: number | string | boolean | T): ExtendedNumber | ExtendedString | ExtendedBoolean | T {
  if (typeof val === 'number') {
    return new RegularNumber(val)
  } else if (typeof val === 'string') {
    return new ExtendedString(val)
  } else if (typeof val === 'boolean') {
    return new ExtendedBoolean(val)
  } else {
    return val
  }
}

export interface ExtendedVal {
  get(): number | string | boolean
}

export abstract class ExtendedNumber implements ExtendedVal {
  constructor(private val: number) {}
  public get(): number {
    return this.val
  }
  public clone(val: number): this{
    return new (<any>this.constructor)(val)
  }
}

export class RegularNumber extends ExtendedNumber {}
export class DateNumber extends ExtendedNumber {}
export class CurrencyNumber extends ExtendedNumber {}
export class TimeNumber extends ExtendedNumber {}
export class DateTimeNumber extends ExtendedNumber {}

export class ExtendedString implements ExtendedVal {
  constructor(private val: string) {}
  public get(): string {
    return this.val
  }
}

export class ExtendedBoolean implements ExtendedVal {
  constructor(private val: boolean) {}
  public get(): boolean {
    return this.val
  }
}

