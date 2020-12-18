/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {SimpleRangeValue} from './SimpleRangeValue'

export const EmptyValue = Symbol('Empty value')
export type EmptyValueType = typeof EmptyValue
export type InternalNoErrorScalarValue = number | string | boolean | EmptyValueType
export type InternalScalarValue = InternalNoErrorScalarValue | CellError

export type InterpreterValue = InternalScalarValue | SimpleRangeValue
