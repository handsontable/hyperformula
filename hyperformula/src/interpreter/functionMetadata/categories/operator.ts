/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Operator" category. Authored here: this catalogue is the source of
 * truth for the function metadata API, and `docs/guide/built-in-functions.md` is generated from it.
 */
export const OPERATOR_DOCS: Record<string, FunctionDoc> = {
  'HF.ADD': {
    category: 'Operator',
    shortDescription: 'Adds two values.',
    parameters: [{name: 'number1', description: 'The first number in the addition.'}, {name: 'number2', description: 'The second number, added to number1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.ADD(2, 3)', '=HF.ADD(A1, B1)'],
  },
  'HF.CONCAT': {
    category: 'Operator',
    shortDescription: 'Concatenates two strings.',
    parameters: [{name: 'string1', description: 'The first string in the concatenation.'}, {name: 'string2', description: 'The second string, appended to the end of string1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.CONCAT("Hello, ", "World!")', '=HF.CONCAT(A1, B1)'],
  },
  'HF.DIVIDE': {
    category: 'Operator',
    shortDescription: 'Divides two values.',
    parameters: [{name: 'number1', description: 'The dividend, i.e. the number being divided.'}, {name: 'number2', description: 'The divisor. Dividing by 0 returns the #DIV/0! error.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.DIVIDE(10, 2)', '=HF.DIVIDE(A1, B1)'],
  },
  'HF.EQ': {
    category: 'Operator',
    shortDescription: 'Tests two values for equality.',
    parameters: [{name: 'value1', description: 'The first value to compare.'}, {name: 'value2', description: 'The second value, compared with value1; the result is TRUE when the two values are equal.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.EQ(5, 5)', '=HF.EQ(A1, B1)'],
  },
  'HF.GT': {
    category: 'Operator',
    shortDescription: 'Tests two values for greater-than relation.',
    parameters: [{name: 'value1', description: 'The value tested against value2.'}, {name: 'value2', description: 'The value that value1 is compared against; the result is TRUE when value1 is greater than value2.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.GT(5, 3)', '=HF.GT(A1, B1)'],
  },
  'HF.GTE': {
    category: 'Operator',
    shortDescription: 'Tests two values for greater-equal relation.',
    parameters: [{name: 'value1', description: 'The value tested against value2.'}, {name: 'value2', description: 'The value that value1 is compared against; the result is TRUE when value1 is greater than or equal to value2.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.GTE(5, 5)', '=HF.GTE(A1, B1)'],
  },
  'HF.LT': {
    category: 'Operator',
    shortDescription: 'Tests two values for less-than relation.',
    parameters: [{name: 'value1', description: 'The value tested against value2.'}, {name: 'value2', description: 'The value that value1 is compared against; the result is TRUE when value1 is less than value2.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.LT(3, 5)', '=HF.LT(A1, B1)'],
  },
  'HF.LTE': {
    category: 'Operator',
    shortDescription: 'Tests two values for less-equal relation.',
    parameters: [{name: 'value1', description: 'The value tested against value2.'}, {name: 'value2', description: 'The value that value1 is compared against; the result is TRUE when value1 is less than or equal to value2.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.LTE(5, 5)', '=HF.LTE(A1, B1)'],
  },
  'HF.MINUS': {
    category: 'Operator',
    shortDescription: 'Subtracts two values.',
    parameters: [{name: 'number1', description: 'The number to subtract from.'}, {name: 'number2', description: 'The number subtracted from number1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.MINUS(10, 4)', '=HF.MINUS(A1, B1)'],
  },
  'HF.MULTIPLY': {
    category: 'Operator',
    shortDescription: 'Multiplies two values.',
    parameters: [{name: 'number1', description: 'The first factor in the multiplication.'}, {name: 'number2', description: 'The second factor, multiplied by number1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.MULTIPLY(4, 5)', '=HF.MULTIPLY(A1, B1)'],
  },
  'HF.NE': {
    category: 'Operator',
    shortDescription: 'Tests two values for inequality.',
    parameters: [{name: 'value1', description: 'The first value to compare.'}, {name: 'value2', description: 'The second value, compared with value1; the result is TRUE when the two values are not equal.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.NE(5, 3)', '=HF.NE(A1, B1)'],
  },
  'HF.POW': {
    category: 'Operator',
    shortDescription: 'Computes power of two values.',
    parameters: [{name: 'number1', description: 'The base number.'}, {name: 'number2', description: 'The exponent that number1 is raised to.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.POW(2, 3)', '=HF.POW(A1, 2)'],
  },
  'HF.UMINUS': {
    category: 'Operator',
    shortDescription: 'Negates the value.',
    parameters: [{name: 'number', description: 'The number to negate.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.UMINUS(5)', '=HF.UMINUS(A1)'],
  },
  'HF.UNARY_PERCENT': {
    category: 'Operator',
    shortDescription: 'Applies percent operator.',
    parameters: [{name: 'number', description: 'The number to convert to a percentage, i.e. divided by 100.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.UNARY_PERCENT(50)', '=HF.UNARY_PERCENT(A1)'],
  },
  'HF.UPLUS': {
    category: 'Operator',
    shortDescription: 'Applies unary plus.',
    parameters: [{name: 'number', description: 'The number that the unary plus operator is applied to; the value is returned unchanged.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HF.UPLUS(5)', '=HF.UPLUS(A1)'],
  },
}
