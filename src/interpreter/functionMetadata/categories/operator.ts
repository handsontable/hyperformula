/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Operator" category. Generated from `docs/guide/built-in-functions.md` by
 * a one-time migration script (since removed); parameter descriptions are authored in a later phase.
 */
export const OPERATOR_DOCS: Record<string, FunctionDoc> = {
  'HF.ADD': {
    category: 'Operator',
    shortDescription: 'Adds two values.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  'HF.CONCAT': {
    category: 'Operator',
    shortDescription: 'Concatenates two strings.',
    parameters: [{name: 'string1', description: ''}, {name: 'string2', description: ''}],
  },
  'HF.DIVIDE': {
    category: 'Operator',
    shortDescription: 'Divides two values.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  'HF.EQ': {
    category: 'Operator',
    shortDescription: 'Tests two values for equality.',
    parameters: [{name: 'value1', description: ''}, {name: 'value2', description: ''}],
  },
  'HF.GT': {
    category: 'Operator',
    shortDescription: 'Tests two values for greater-than relation.',
    parameters: [{name: 'value1', description: ''}, {name: 'value2', description: ''}],
  },
  'HF.GTE': {
    category: 'Operator',
    shortDescription: 'Tests two values for greater-equal relation.',
    parameters: [{name: 'value1', description: ''}, {name: 'value2', description: ''}],
  },
  'HF.LT': {
    category: 'Operator',
    shortDescription: 'Tests two values for less-than relation.',
    parameters: [{name: 'value1', description: ''}, {name: 'value2', description: ''}],
  },
  'HF.LTE': {
    category: 'Operator',
    shortDescription: 'Tests two values for less-equal relation.',
    parameters: [{name: 'value1', description: ''}, {name: 'value2', description: ''}],
  },
  'HF.MINUS': {
    category: 'Operator',
    shortDescription: 'Subtracts two values.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  'HF.MULTIPLY': {
    category: 'Operator',
    shortDescription: 'Multiplies two values.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  'HF.NE': {
    category: 'Operator',
    shortDescription: 'Tests two values for inequality.',
    parameters: [{name: 'value1', description: ''}, {name: 'value2', description: ''}],
  },
  'HF.POW': {
    category: 'Operator',
    shortDescription: 'Computes power of two values.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  'HF.UMINUS': {
    category: 'Operator',
    shortDescription: 'Negates the value.',
    parameters: [{name: 'number', description: ''}],
  },
  'HF.UNARY_PERCENT': {
    category: 'Operator',
    shortDescription: 'Applies percent operator.',
    parameters: [{name: 'number', description: ''}],
  },
  'HF.UPLUS': {
    category: 'Operator',
    shortDescription: 'Applies unary plus.',
    parameters: [{name: 'number', description: ''}],
  },
}
