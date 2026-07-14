/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Math and trigonometry" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const MATH_AND_TRIGONOMETRY_DOCS: Record<string, FunctionDoc> = {
  ABS: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the absolute value of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  ACOS: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric cosine of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  ACOSH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse hyperbolic cosine of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  ACOT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric cotangent of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  ACOTH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse hyperbolic cotangent of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  ARABIC: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts number from roman form.',
    parameters: [{name: 'string', description: ''}],
  },
  ASIN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric sine of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  ASINH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse hyperbolic sine of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  ATAN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric tangent of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  ATAN2: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric tangent of the specified x and y coordinates.',
    parameters: [{name: 'number_x', description: ''}, {name: 'number_y', description: ''}],
  },
  ATANH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse hyperbolic tangent of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  BASE: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts a positive integer to a specified base into a text from the numbering system.',
    parameters: [{name: 'number', description: ''}, {name: 'radix', description: ''}, {name: 'minimum_length', description: ''}],
  },
  CEILING: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number up to the nearest multiple of Significance.',
    parameters: [{name: 'number', description: ''}, {name: 'significance', description: ''}],
  },
  'CEILING.MATH': {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number up to the nearest multiple of Significance.',
    parameters: [{name: 'number', description: ''}, {name: 'significance', description: ''}, {name: 'mode', description: ''}],
  },
  'CEILING.PRECISE': {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number up to the nearest multiple of Significance.',
    parameters: [{name: 'number', description: ''}, {name: 'significance', description: ''}],
  },
  COMBIN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns number of combinations (without repetitions).',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  COMBINA: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns number of combinations (with repetitions).',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  COS: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the cosine of the given angle (in radians).',
    parameters: [{name: 'number', description: ''}],
  },
  COSH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic cosine of the given value.',
    parameters: [{name: 'number', description: ''}],
  },
  COT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the cotangent of the given angle (in radians).',
    parameters: [{name: 'number', description: ''}],
  },
  COTH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic cotangent of the given value.',
    parameters: [{name: 'number', description: ''}],
  },
  COUNTUNIQUE: {
    category: 'Math and trigonometry',
    shortDescription: 'Counts the number of unique values in a list of specified values and ranges.',
    parameters: [{name: 'value1', description: ''}],
  },
  CSC: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the cosecant of the given angle (in radians).',
    parameters: [{name: 'number', description: ''}],
  },
  CSCH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic cosecant of the given value.',
    parameters: [{name: 'number', description: ''}],
  },
  DECIMAL: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts text with characters from a number system to a positive integer in the base radix given.',
    parameters: [{name: 'text', description: ''}, {name: 'radix', description: ''}],
  },
  DEGREES: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts radians into degrees.',
    parameters: [{name: 'number', description: ''}],
  },
  EVEN: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a positive number up to the next even integer and a negative number down to the next even integer.',
    parameters: [{name: 'number', description: ''}],
  },
  EXP: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns constant e raised to the power of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  FACT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a factorial of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  FACTDOUBLE: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a double factorial of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  FLOOR: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number down to the nearest multiple of Significance.',
    parameters: [{name: 'number', description: ''}, {name: 'significance', description: ''}],
  },
  'FLOOR.MATH': {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number down to the nearest multiple of Significance.',
    parameters: [{name: 'number', description: ''}, {name: 'significance', description: ''}, {name: 'mode', description: ''}],
  },
  'FLOOR.PRECISE': {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number down to the nearest multiple of Significance.',
    parameters: [{name: 'number', description: ''}, {name: 'significance', description: ''}],
  },
  GCD: {
    category: 'Math and trigonometry',
    shortDescription: 'Computes greatest common divisor of numbers.',
    parameters: [{name: 'number1', description: ''}],
  },
  INT: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number down to the nearest integer.',
    parameters: [{name: 'number', description: ''}],
  },
  LCM: {
    category: 'Math and trigonometry',
    shortDescription: 'Computes least common multiple of numbers.',
    parameters: [{name: 'number1', description: ''}],
  },
  LN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the natural logarithm based on the constant e of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  LOG: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the logarithm of a number to the specified base.',
    parameters: [{name: 'number', description: ''}, {name: 'base', description: ''}],
  },
  LOG10: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the base-10 logarithm of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  MOD: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the remainder when one integer is divided by another.',
    parameters: [{name: 'dividend', description: ''}, {name: 'divisor', description: ''}],
  },
  MROUND: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds number to the neares multiplicity.',
    parameters: [{name: 'number', description: ''}, {name: 'base', description: ''}],
  },
  MULTINOMIAL: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns number of multiset combinations.',
    parameters: [{name: 'number1', description: ''}],
  },
  ODD: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a positive number up to the nearest odd integer and a negative number down to the nearest odd integer.',
    parameters: [{name: 'number', description: ''}],
  },
  PI: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns 3.14159265358979, the value of the mathematical constant PI to 14 decimal places.',
    parameters: [],
  },
  POWER: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a number raised to another number.',
    parameters: [{name: 'base', description: ''}, {name: 'exponent', description: ''}],
  },
  PRODUCT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns product of numbers.',
    parameters: [{name: 'number1', description: ''}],
  },
  QUOTIENT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns integer part of a division.',
    parameters: [{name: 'dividend', description: ''}, {name: 'divisor', description: ''}],
  },
  RADIANS: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts degrees to radians.',
    parameters: [{name: 'number', description: ''}],
  },
  RAND: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a random number between 0 and 1.',
    parameters: [],
  },
  RANDBETWEEN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a random integer between two numbers.',
    parameters: [{name: 'lower_bound', description: ''}, {name: 'upper_bound', description: ''}],
  },
  ROMAN: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts number to roman form.',
    parameters: [{name: 'number', description: ''}, {name: 'mode', description: ''}],
  },
  ROUND: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number to a certain number of decimal places.',
    parameters: [{name: 'number', description: ''}, {name: 'count', description: ''}],
  },
  ROUNDDOWN: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number down, toward zero, to a certain precision.',
    parameters: [{name: 'number', description: ''}, {name: 'count', description: ''}],
  },
  ROUNDUP: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number up, away from zero, to a certain precision.',
    parameters: [{name: 'number', description: ''}, {name: 'count', description: ''}],
  },
  SEC: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the secant of the given angle (in radians).',
    parameters: [{name: 'number', description: ''}],
  },
  SECH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic secant of the given angle (in radians).',
    parameters: [{name: 'number', description: ''}],
  },
  SERIESSUM: {
    category: 'Math and trigonometry',
    shortDescription: 'Evaluates series at a point.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}, {name: 'coefficients', description: ''}],
  },
  SIGN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns sign of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  SIN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sine of the given angle (in radians).',
    parameters: [{name: 'number', description: ''}],
  },
  SINH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic sine of the given value.',
    parameters: [{name: 'number', description: ''}],
  },
  SQRT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the positive square root of a number.',
    parameters: [{name: 'number', description: ''}],
  },
  SQRTPI: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns sqrt of number times pi.',
    parameters: [{name: 'number', description: ''}],
  },
  SUBTOTAL: {
    category: 'Math and trigonometry',
    shortDescription: 'Computes aggregation using function specified by number.',
    parameters: [{name: 'function', description: ''}, {name: 'number1', description: ''}],
  },
  // HAND-AUTHORED reference functions (HF-249): SUM and SUMIF carry real parameter descriptions, examples and a
  // documentationUrl so the Formula Builder team can test rendering of populated metadata. The migration generator
  // (scripts/hf249-migrate-function-docs.ts) does NOT emit `examples`/`documentationUrl`, so DO NOT re-run it over
  // this file without merge-preserving these two entries, or they will be silently reset to empty.
  SUM: {
    category: 'Math and trigonometry',
    shortDescription: 'Sums up the values of the specified cells.',
    parameters: [{name: 'number1', description: 'A number, cell reference, or range whose values are added together. Further numbers or ranges can be passed as additional arguments.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions',
    examples: ['=SUM(1, 2, 3)', '=SUM(A1:A10)', '=SUM(B1:B5, 100)'],
  },
  SUMIF: {
    category: 'Math and trigonometry',
    shortDescription: 'Sums up the values of cells that belong to the specified range and meet the specified condition.',
    parameters: [
      {name: 'range', description: 'The range of cells tested against the criterion.'},
      {name: 'criteria', description: 'The condition that selects which cells are summed, e.g. ">5", "apples", or a cell reference.'},
      {name: 'sum_range', description: 'The range of cells to sum. When omitted, the cells in Range are summed instead.'},
    ],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions',
    examples: ['=SUMIF(A1:A10, ">5")', '=SUMIF(B1:B10, "apples", C1:C10)'],
  },
  SUMIFS: {
    category: 'Math and trigonometry',
    shortDescription: 'Sums up the values of cells that belong to the specified range and meet the specified sets of conditions.',
    parameters: [{name: 'sum_range', description: ''}, {name: 'criterion_range1', description: ''}, {name: 'criterion1', description: ''}],
  },
  SUMPRODUCT: {
    category: 'Math and trigonometry',
    shortDescription: 'Multiplies corresponding elements in the given arrays, and returns the sum of those products.',
    parameters: [{name: 'array1', description: ''}],
  },
  SUMSQ: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sum of the squares of the arguments',
    parameters: [{name: 'number1', description: ''}],
  },
  SUMX2MY2: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sum of the square differences.',
    parameters: [{name: 'range1', description: ''}, {name: 'range2', description: ''}],
  },
  SUMX2PY2: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sum of the square sums.',
    parameters: [{name: 'range1', description: ''}, {name: 'range2', description: ''}],
  },
  SUMXMY2: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sum of the square of differences.',
    parameters: [{name: 'range1', description: ''}, {name: 'range2', description: ''}],
  },
  TAN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the tangent of the given angle (in radians).',
    parameters: [{name: 'number', description: ''}],
  },
  TANH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic tangent of the given value.',
    parameters: [{name: 'number', description: ''}],
  },
}
