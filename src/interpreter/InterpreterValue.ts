/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {AsyncVertex} from '../DependencyGraph/FormulaCellVertex'
import {SimpleRangeValue} from './SimpleRangeValue'

export const EmptyValue = Symbol('Empty value')

export type EmptyValueType = typeof EmptyValue

export type InternalNoErrorScalarValue = RichNumber | RawNoErrorScalarValue

export type InternalScalarValue = RichNumber | RawScalarValue
export type AsyncInternalScalarValue = Promise<InternalScalarValue>

export type InterpreterValue = RichNumber | RawInterpreterValue
export type AsyncInterpreterValue = Promise<InterpreterValue>

export type RawNoErrorScalarValue = number | string | boolean | EmptyValueType
export type RawScalarValue = RawNoErrorScalarValue | CellError
export type RawInterpreterValue = RawScalarValue | SimpleRangeValue

export function getRawValue<T>(num: RichNumber | T): number | T {
  if (num instanceof RichNumber) {
    return num.val
  } else {
    return num
  }
}

export abstract class RichNumber {
  constructor(public val: number,
              public format?: string) {
  }

  public fromNumber(val: number): this {
    return new (this.constructor as any)(val)
  }

  abstract getDetailedType(): NumberType
}

export function cloneNumber(val: ExtendedNumber, newVal: number): ExtendedNumber {
  if (typeof val === 'number') {
    return newVal
  } else {
    const ret = val.fromNumber(newVal)
    ret.format = val.format
    return ret
  }
}

export class DateNumber extends RichNumber {
  public getDetailedType(): NumberType {
    return NumberType.NUMBER_DATE
  }
}

export class CurrencyNumber extends RichNumber {
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

export function getTypeOfExtendedNumber(num: ExtendedNumber): NumberType {
  if (num instanceof RichNumber) {
    return num.getDetailedType()
  } else {
    return NumberType.NUMBER_RAW
  }
}

export type FormatInfo = string | undefined

export function getFormatOfExtendedNumber(num: ExtendedNumber): FormatInfo {
  if (num instanceof RichNumber) {
    return num.format
  } else {
    return undefined
  }
}

export type NumberTypeWithFormat = { type: NumberType, format?: FormatInfo }

export function getTypeFormatOfExtendedNumber(num: ExtendedNumber): NumberTypeWithFormat {
  if (num instanceof RichNumber) {
    return {type: num.getDetailedType(), format: num.format}
  } else {
    return {type: NumberType.NUMBER_RAW}
  }
}

export interface AsyncPromiseVertex {
  getPromise?: () => AsyncInterpreterValue,
  asyncVertex?: AsyncVertex,
} 

export type InterpreterTuple = [InterpreterValue, AsyncPromiseVertex]
export type OptionalInterpreterTuple = [InterpreterValue, AsyncPromiseVertex?]
