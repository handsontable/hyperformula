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
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Adds two values.',
    parameters: [{name: 'number1', description: 'The first number in the addition.'}, {name: 'number2', description: 'The second number, added to Number1.'}],
    examples: ['=HF.ADD(2, 3)', '=HF.ADD(A1, B1)'],
  },
  'HF.CONCAT': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Concatenates two strings.',
    parameters: [{name: 'string1', description: 'The first string in the concatenation.'}, {name: 'string2', description: 'The second string, appended to the end of String1.'}],
    examples: ['=HF.CONCAT("Hello, ", "World!")', '=HF.CONCAT(A1, B1)'],
  },
  'HF.DIVIDE': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Divides two values.',
    parameters: [{name: 'number1', description: 'The dividend, i.e. the number being divided.'}, {name: 'number2', description: 'The divisor. Dividing by 0 returns the #DIV/0! error.'}],
    examples: ['=HF.DIVIDE(10, 2)', '=HF.DIVIDE(A1, B1)'],
  },
  'HF.EQ': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Tests two values for equality.',
    parameters: [{name: 'value1', description: 'The first value to compare.'}, {name: 'value2', description: 'The second value, compared with Value1; the result is TRUE when the two values are equal.'}],
    examples: ['=HF.EQ(5, 5)', '=HF.EQ(A1, B1)'],
  },
  'HF.GT': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Tests two values for greater-than relation.',
    parameters: [{name: 'value1', description: 'The value tested against Value2.'}, {name: 'value2', description: 'The value that Value1 is compared against; the result is TRUE when Value1 is greater than Value2.'}],
    examples: ['=HF.GT(5, 3)', '=HF.GT(A1, B1)'],
  },
  'HF.GTE': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Tests two values for greater-equal relation.',
    parameters: [{name: 'value1', description: 'The value tested against Value2.'}, {name: 'value2', description: 'The value that Value1 is compared against; the result is TRUE when Value1 is greater than or equal to Value2.'}],
    examples: ['=HF.GTE(5, 5)', '=HF.GTE(A1, B1)'],
  },
  'HF.LT': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Tests two values for less-than relation.',
    parameters: [{name: 'value1', description: 'The value tested against Value2.'}, {name: 'value2', description: 'The value that Value1 is compared against; the result is TRUE when Value1 is less than Value2.'}],
    examples: ['=HF.LT(3, 5)', '=HF.LT(A1, B1)'],
  },
  'HF.LTE': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Tests two values for less-equal relation.',
    parameters: [{name: 'value1', description: 'The value tested against Value2.'}, {name: 'value2', description: 'The value that Value1 is compared against; the result is TRUE when Value1 is less than or equal to Value2.'}],
    examples: ['=HF.LTE(5, 5)', '=HF.LTE(A1, B1)'],
  },
  'HF.MINUS': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Subtracts two values.',
    parameters: [{name: 'number1', description: 'The number to subtract from.'}, {name: 'number2', description: 'The number subtracted from Number1.'}],
    examples: ['=HF.MINUS(10, 4)', '=HF.MINUS(A1, B1)'],
  },
  'HF.MULTIPLY': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Multiplies two values.',
    parameters: [{name: 'number1', description: 'The first factor in the multiplication.'}, {name: 'number2', description: 'The second factor, multiplied by Number1.'}],
    examples: ['=HF.MULTIPLY(4, 5)', '=HF.MULTIPLY(A1, B1)'],
  },
  'HF.NE': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Tests two values for inequality.',
    parameters: [{name: 'value1', description: 'The first value to compare.'}, {name: 'value2', description: 'The second value, compared with Value1; the result is TRUE when the two values are not equal.'}],
    examples: ['=HF.NE(5, 3)', '=HF.NE(A1, B1)'],
  },
  'HF.POW': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Computes power of two values.',
    parameters: [{name: 'number1', description: 'The base number.'}, {name: 'number2', description: 'The exponent that Number1 is raised to.'}],
    examples: ['=HF.POW(2, 3)', '=HF.POW(A1, 2)'],
  },
  'HF.UMINUS': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Negates the value.',
    parameters: [{name: 'number', description: 'The number to negate.'}],
    examples: ['=HF.UMINUS(5)', '=HF.UMINUS(A1)'],
  },
  'HF.UNARY_PERCENT': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Applies percent operator.',
    parameters: [{name: 'number', description: 'The number to convert to a percentage, i.e. divided by 100.'}],
    examples: ['=HF.UNARY_PERCENT(50)', '=HF.UNARY_PERCENT(A1)'],
  },
  'HF.UPLUS': {
    category: 'Operator',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Applies unary plus.',
    parameters: [{name: 'number', description: 'The number that the unary plus operator is applied to; the value is returned unchanged.'}],
    examples: ['=HF.UPLUS(5)', '=HF.UPLUS(A1)'],
  },
}
