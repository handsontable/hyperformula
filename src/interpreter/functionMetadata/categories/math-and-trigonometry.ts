/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Math and trigonometry" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`. The `examples` and parameter
 * descriptions are hand-authored; re-running that script overwrites them.
 */
export const MATH_AND_TRIGONOMETRY_DOCS: Record<string, FunctionDoc> = {
  ABS: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the absolute value of a number.',
    parameters: [{name: 'Number', description: 'A number, or a cell reference to one, whose absolute value is returned.'}],
    examples: ['=ABS(-5)', '=ABS(A1)'],
  },
  ACOS: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric cosine of a number.',
    parameters: [{name: 'Number', description: 'A number between -1 and 1 whose arccosine, in radians, is returned.'}],
    examples: ['=ACOS(1)', '=ACOS(0.5)'],
  },
  ACOSH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse hyperbolic cosine of a number.',
    parameters: [{name: 'Number', description: 'A number greater than or equal to 1 whose inverse hyperbolic cosine is returned.'}],
    examples: ['=ACOSH(1)', '=ACOSH(10)'],
  },
  ACOT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric cotangent of a number.',
    parameters: [{name: 'Number', description: 'A number whose arccotangent, in radians, is returned.'}],
    examples: ['=ACOT(1)', '=ACOT(0)'],
  },
  ACOTH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse hyperbolic cotangent of a number.',
    parameters: [{name: 'Number', description: 'A number with an absolute value greater than 1 whose inverse hyperbolic cotangent is returned.'}],
    examples: ['=ACOTH(2)', '=ACOTH(-5)'],
  },
  ARABIC: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts number from roman form.',
    parameters: [{name: 'String', description: 'A Roman numeral text (e.g. "MCMXC") to convert to its Arabic number equivalent.'}],
    examples: ['=ARABIC("MCMXC")', '=ARABIC("IV")'],
  },
  ASIN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric sine of a number.',
    parameters: [{name: 'Number', description: 'A number between -1 and 1 whose arcsine, in radians, is returned.'}],
    examples: ['=ASIN(1)', '=ASIN(0.5)'],
  },
  ASINH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse hyperbolic sine of a number.',
    parameters: [{name: 'Number', description: 'A number whose inverse hyperbolic sine is returned.'}],
    examples: ['=ASINH(1)', '=ASINH(-2.5)'],
  },
  ATAN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric tangent of a number.',
    parameters: [{name: 'Number', description: 'A number whose arctangent, in radians, is returned.'}],
    examples: ['=ATAN(1)', '=ATAN(0)'],
  },
  ATAN2: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse trigonometric tangent of the specified x and y coordinates.',
    parameters: [
      {name: 'Numberx', description: 'The x-coordinate of the point.'},
      {name: 'Numbery', description: 'The y-coordinate of the point.'},
    ],
    examples: ['=ATAN2(1, 1)', '=ATAN2(-1, 2)'],
  },
  ATANH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the inverse hyperbolic tangent of a number.',
    parameters: [{name: 'Number', description: 'A number between -1 and 1 (exclusive) whose inverse hyperbolic tangent is returned.'}],
    examples: ['=ATANH(0.5)', '=ATANH(-0.2)'],
  },
  BASE: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts a positive integer to a specified base into a text from the numbering system.',
    parameters: [
      {name: 'Number', description: 'The non-negative integer to convert.'},
      {name: 'Radix', description: 'The base (from 2 to 36) to convert the number into.'},
      {name: 'Minimumlength', description: 'The minimum length of the returned string; the result is left-padded with zeros when shorter.'},
    ],
    examples: ['=BASE(15, 2)', '=BASE(100, 16, 4)'],
  },
  CEILING: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number up to the nearest multiple of Significance.',
    parameters: [
      {name: 'Number', description: 'The value to round up.'},
      {name: 'Significance', description: 'The multiple to round up to. When Number is positive, Significance must also be positive; otherwise the result is a #NUM! error.'},
    ],
    examples: ['=CEILING(4.3, 1)', '=CEILING(22.5, 5)'],
  },
  'CEILING.MATH': {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number up to the nearest multiple of Significance.',
    parameters: [
      {name: 'Number', description: 'The value to round up.'},
      {name: 'Significance', description: 'The multiple to round up to. Defaults to 1 when omitted.'},
      {name: 'Mode', description: 'For negative numbers, when non-zero, rounds away from zero instead of toward it.'},
    ],
    examples: ['=CEILING.MATH(4.3)', '=CEILING.MATH(-4.3, 2, 1)'],
  },
  'CEILING.PRECISE': {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number up to the nearest multiple of Significance.',
    parameters: [
      {name: 'Number', description: 'The value to round up.'},
      {name: 'Significance', description: 'The multiple to round up to; its sign is ignored. Defaults to 1 when omitted.'},
    ],
    examples: ['=CEILING.PRECISE(4.3, 1)', '=CEILING.PRECISE(-4.3, 2)'],
  },
  COMBIN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns number of combinations (without repetitions).',
    parameters: [
      {name: 'Number1', description: 'The total number of items.'},
      {name: 'Number2', description: 'The number of items in each combination.'},
    ],
    examples: ['=COMBIN(8, 2)', '=COMBIN(52, 5)'],
  },
  COMBINA: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns number of combinations (with repetitions).',
    parameters: [
      {name: 'Number1', description: 'The total number of items.'},
      {name: 'Number2', description: 'The number of items in each combination, where an item may repeat.'},
    ],
    examples: ['=COMBINA(4, 3)', '=COMBINA(10, 2)'],
  },
  COS: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the cosine of the given angle (in radians).',
    parameters: [{name: 'Number', description: 'An angle in radians whose cosine is returned.'}],
    examples: ['=COS(0)', '=COS(PI())'],
  },
  COSH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic cosine of the given value.',
    parameters: [{name: 'Number', description: 'A number whose hyperbolic cosine is returned.'}],
    examples: ['=COSH(0)', '=COSH(1)'],
  },
  COT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the cotangent of the given angle (in radians).',
    parameters: [{name: 'Number', description: 'A non-zero angle in radians whose cotangent is returned.'}],
    examples: ['=COT(1)', '=COT(PI()/4)'],
  },
  COTH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic cotangent of the given value.',
    parameters: [{name: 'Number', description: 'A non-zero number whose hyperbolic cotangent is returned.'}],
    examples: ['=COTH(2)', '=COTH(-1)'],
  },
  COUNTUNIQUE: {
    category: 'Math and trigonometry',
    shortDescription: 'Counts the number of unique values in a list of specified values and ranges.',
    parameters: [{name: 'Value1', description: 'A value, cell reference, or range to check for uniqueness. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=COUNTUNIQUE(1, 2, 2, 3)', '=COUNTUNIQUE(A1:A10)'],
  },
  CSC: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the cosecant of the given angle (in radians).',
    parameters: [{name: 'Number', description: 'A non-zero angle in radians whose cosecant is returned.'}],
    examples: ['=CSC(1)', '=CSC(PI()/2)'],
  },
  CSCH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic cosecant of the given value.',
    parameters: [{name: 'Number', description: 'A non-zero number whose hyperbolic cosecant is returned.'}],
    examples: ['=CSCH(1)', '=CSCH(-2)'],
  },
  DECIMAL: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts text with characters from a number system to a positive integer in the base radix given.',
    parameters: [
      {name: 'Text', description: 'The text representation of the number to convert.'},
      {name: 'Radix', description: 'The base (from 2 to 36) that Text is expressed in.'},
    ],
    examples: ['=DECIMAL("1100", 2)', '=DECIMAL("FF", 16)'],
  },
  DEGREES: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts radians into degrees.',
    parameters: [{name: 'Number', description: 'An angle in radians to convert to degrees.'}],
    examples: ['=DEGREES(PI())', '=DEGREES(1)'],
  },
  EVEN: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a positive number up to the next even integer and a negative number down to the next even integer.',
    parameters: [{name: 'Number', description: 'The number to round away from zero to the next even integer.'}],
    examples: ['=EVEN(3)', '=EVEN(-3)'],
  },
  EXP: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns constant e raised to the power of a number.',
    parameters: [{name: 'Number', description: 'The exponent to which the constant e is raised.'}],
    examples: ['=EXP(1)', '=EXP(0)'],
  },
  FACT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a factorial of a number.',
    parameters: [{name: 'Number', description: 'A non-negative number whose factorial is returned; the value is truncated to an integer.'}],
    examples: ['=FACT(5)', '=FACT(0)'],
  },
  FACTDOUBLE: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a double factorial of a number.',
    parameters: [{name: 'Number', description: 'A non-negative number whose double factorial is returned; the value is truncated to an integer.'}],
    examples: ['=FACTDOUBLE(6)', '=FACTDOUBLE(7)'],
  },
  FLOOR: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number down to the nearest multiple of Significance.',
    parameters: [
      {name: 'Number', description: 'The value to round down.'},
      {name: 'Significance', description: 'The multiple to round down to. When Number is positive, Significance must also be positive; otherwise the result is a #NUM! error.'},
    ],
    examples: ['=FLOOR(4.7, 1)', '=FLOOR(22.5, 5)'],
  },
  'FLOOR.MATH': {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number down to the nearest multiple of Significance.',
    parameters: [
      {name: 'Number', description: 'The value to round down.'},
      {name: 'Significance', description: 'The multiple to round down to. Defaults to 1 when omitted.'},
      {name: 'Mode', description: 'For negative numbers, when non-zero, rounds toward zero instead of away from it.'},
    ],
    examples: ['=FLOOR.MATH(4.7)', '=FLOOR.MATH(-4.7, 2, 1)'],
  },
  'FLOOR.PRECISE': {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number down to the nearest multiple of Significance.',
    parameters: [
      {name: 'Number', description: 'The value to round down.'},
      {name: 'Significance', description: 'The multiple to round down to; its sign is ignored. Defaults to 1 when omitted.'},
    ],
    examples: ['=FLOOR.PRECISE(4.7, 1)', '=FLOOR.PRECISE(-4.7, 2)'],
  },
  GCD: {
    category: 'Math and trigonometry',
    shortDescription: 'Computes greatest common divisor of numbers.',
    parameters: [{name: 'Number1', description: 'A non-negative number, cell reference, or range. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=GCD(24, 36)', '=GCD(A1:A5)'],
  },
  INT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the integer part of a number by discarding its fractional part.',
    parameters: [{name: 'Number', description: 'The number to convert to an integer by dropping its fractional part (rounding toward zero, so INT(-8.9) is -8).'}],
    examples: ['=INT(8.9)', '=INT(-8.9)'],
  },
  LCM: {
    category: 'Math and trigonometry',
    shortDescription: 'Computes least common multiple of numbers.',
    parameters: [{name: 'Number1', description: 'A non-negative number, cell reference, or range. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=LCM(4, 6)', '=LCM(A1:A5)'],
  },
  LN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the natural logarithm based on the constant e of a number.',
    parameters: [{name: 'Number', description: 'A positive number whose natural logarithm is returned.'}],
    examples: ['=LN(1)', '=LN(2.718281828)'],
  },
  LOG: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the logarithm of a number to the specified base.',
    parameters: [
      {name: 'Number', description: 'A positive number whose logarithm is returned.'},
      {name: 'Base', description: 'The base of the logarithm. Defaults to 10 when omitted.'},
    ],
    examples: ['=LOG(100, 10)', '=LOG(8, 2)'],
  },
  LOG10: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the base-10 logarithm of a number.',
    parameters: [{name: 'Number', description: 'A positive number whose base-10 logarithm is returned.'}],
    examples: ['=LOG10(100)', '=LOG10(1000)'],
  },
  MOD: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the remainder when one integer is divided by another.',
    parameters: [
      {name: 'Dividend', description: 'The number to be divided.'},
      {name: 'Divisor', description: 'The non-zero number to divide by. The result has the same sign as the dividend.'},
    ],
    examples: ['=MOD(10, 3)', '=MOD(-7, 2)'],
  },
  MROUND: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds number to the neares multiplicity.',
    parameters: [
      {name: 'Number', description: 'The value to round.'},
      {name: 'Base', description: 'The multiple to round Number to; must have the same sign as Number.'},
    ],
    examples: ['=MROUND(10, 3)', '=MROUND(-10, -3)'],
  },
  MULTINOMIAL: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns number of multiset combinations.',
    parameters: [{name: 'Number1', description: 'A non-negative number, cell reference, or range. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=MULTINOMIAL(2, 3, 4)', '=MULTINOMIAL(A1:A3)'],
  },
  ODD: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a positive number up to the nearest odd integer and a negative number down to the nearest odd integer.',
    parameters: [{name: 'Number', description: 'The number to round away from zero to the next odd integer.'}],
    examples: ['=ODD(2)', '=ODD(-2)'],
  },
  PI: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns 3.14159265358979, the value of the mathematical constant PI to 14 decimal places.',
    parameters: [],
    examples: ['=PI()'],
  },
  POWER: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a number raised to another number.',
    parameters: [
      {name: 'Base', description: 'The number to raise to a power.'},
      {name: 'Exponent', description: 'The exponent to raise Base to.'},
    ],
    examples: ['=POWER(2, 10)', '=POWER(9, 0.5)'],
  },
  PRODUCT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns product of numbers.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range whose values are multiplied together. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=PRODUCT(2, 3, 4)', '=PRODUCT(A1:A10)'],
  },
  QUOTIENT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns integer part of a division.',
    parameters: [
      {name: 'Dividend', description: 'The number to be divided.'},
      {name: 'Divisor', description: 'The non-zero number to divide by.'},
    ],
    examples: ['=QUOTIENT(10, 3)', '=QUOTIENT(-10, 3)'],
  },
  RADIANS: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts degrees to radians.',
    parameters: [{name: 'Number', description: 'An angle in degrees to convert to radians.'}],
    examples: ['=RADIANS(180)', '=RADIANS(90)'],
  },
  RAND: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a random number between 0 and 1.',
    parameters: [],
    examples: ['=RAND()'],
  },
  RANDBETWEEN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns a random integer between two numbers.',
    parameters: [
      {name: 'Lowerbound', description: 'The smallest integer that can be returned.'},
      {name: 'Upperbound', description: 'The largest integer that can be returned.'},
    ],
    examples: ['=RANDBETWEEN(1, 10)', '=RANDBETWEEN(-5, 5)'],
  },
  ROMAN: {
    category: 'Math and trigonometry',
    shortDescription: 'Converts number to roman form.',
    parameters: [
      {name: 'Number', description: 'An integer between 1 and 3999 to convert to a Roman numeral.'},
      {name: 'Mode', description: 'Controls how concise the result is, from 0 (classic) to 4 (most abbreviated). Defaults to 0 when omitted.'},
    ],
    examples: ['=ROMAN(1990)', '=ROMAN(1990, 4)'],
  },
  ROUND: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number to a certain number of decimal places.',
    parameters: [
      {name: 'Number', description: 'The value to round.'},
      {name: 'Count', description: 'The number of decimal places to round to. Defaults to 0 when omitted; negative values round to the left of the decimal point.'},
    ],
    examples: ['=ROUND(3.14159, 2)', '=ROUND(1234.5, -2)'],
  },
  ROUNDDOWN: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number down, toward zero, to a certain precision.',
    parameters: [
      {name: 'Number', description: 'The value to round down toward zero.'},
      {name: 'Count', description: 'The number of decimal places to round to. Defaults to 0 when omitted; negative values round to the left of the decimal point.'},
    ],
    examples: ['=ROUNDDOWN(3.789, 2)', '=ROUNDDOWN(-3.789, 1)'],
  },
  ROUNDUP: {
    category: 'Math and trigonometry',
    shortDescription: 'Rounds a number up, away from zero, to a certain precision.',
    parameters: [
      {name: 'Number', description: 'The value to round up, away from zero.'},
      {name: 'Count', description: 'The number of decimal places to round to. Defaults to 0 when omitted; negative values round to the left of the decimal point.'},
    ],
    examples: ['=ROUNDUP(3.14159, 2)', '=ROUNDUP(-3.14159, 1)'],
  },
  SEC: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the secant of the given angle (in radians).',
    parameters: [{name: 'Number', description: 'An angle in radians whose secant is returned.'}],
    examples: ['=SEC(0)', '=SEC(PI()/4)'],
  },
  SECH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic secant of the given angle (in radians).',
    parameters: [{name: 'Number', description: 'A number whose hyperbolic secant is returned.'}],
    examples: ['=SECH(0)', '=SECH(1)'],
  },
  SERIESSUM: {
    category: 'Math and trigonometry',
    shortDescription: 'Evaluates series at a point.',
    parameters: [
      {name: 'Number1', description: 'The input value x to the power series.'},
      {name: 'Number2', description: 'The initial power n to raise x to.'},
      {name: 'Number3', description: 'The step m by which the power increases for each successive term.'},
      {name: 'Coefficients', description: 'A range of coefficients multiplying each successive power of x.'},
    ],
    examples: ['=SERIESSUM(1, 0, 1, A1:A3)', '=SERIESSUM(2, 1, 2, B1:B4)'],
  },
  SIGN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns sign of a number.',
    parameters: [{name: 'Number', description: 'A number to test; returns 1 for positive, -1 for negative, and 0 for zero.'}],
    examples: ['=SIGN(-5)', '=SIGN(0)'],
  },
  SIN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sine of the given angle (in radians).',
    parameters: [{name: 'Number', description: 'An angle in radians whose sine is returned.'}],
    examples: ['=SIN(0)', '=SIN(PI()/2)'],
  },
  SINH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic sine of the given value.',
    parameters: [{name: 'Number', description: 'A number whose hyperbolic sine is returned.'}],
    examples: ['=SINH(0)', '=SINH(1)'],
  },
  SQRT: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the positive square root of a number.',
    parameters: [{name: 'Number', description: 'A non-negative number whose positive square root is returned.'}],
    examples: ['=SQRT(16)', '=SQRT(2)'],
  },
  SQRTPI: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns sqrt of number times pi.',
    parameters: [{name: 'Number', description: 'A non-negative number to multiply by PI before taking the square root.'}],
    examples: ['=SQRTPI(1)', '=SQRTPI(2)'],
  },
  SUBTOTAL: {
    category: 'Math and trigonometry',
    shortDescription: 'Computes aggregation using function specified by number.',
    parameters: [
      {name: 'Function', description: 'A number (1-11 or 101-111) selecting the aggregation function to apply, e.g. 9 for SUM or 1 for AVERAGE.'},
      {name: 'Number1', description: 'A number, cell reference, or range to aggregate. Further numbers or ranges can be passed as additional arguments.'},
    ],
    examples: ['=SUBTOTAL(9, A1:A10)', '=SUBTOTAL(1, B1:B10)'],
  },
  // HAND-AUTHORED reference functions (HF-249): SUM and SUMIF carry real parameter descriptions and examples so
  // the Formula Builder team can test rendering of populated metadata. `documentationUrl` is intentionally absent
  // here — the shared `DEFAULT_DOCUMENTATION_URL` builder default (HF-300) supplies it for every built-in. The
  // migration generator (scripts/hf249-migrate-function-docs.ts) does NOT emit `examples`, so DO NOT re-run it
  // over this file without merge-preserving these two entries, or their examples will be silently reset to empty.
  SUM: {
    category: 'Math and trigonometry',
    shortDescription: 'Sums up the values of the specified cells.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range whose values are added together. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=SUM(1, 2, 3)', '=SUM(A1:A10)', '=SUM(B1:B5, 100)'],
  },
  SUMIF: {
    category: 'Math and trigonometry',
    shortDescription: 'Sums up the values of cells that belong to the specified range and meet the specified condition.',
    parameters: [
      {name: 'Range', description: 'The range of cells tested against the criterion.'},
      {name: 'Criteria', description: 'The condition that selects which cells are summed, e.g. ">5", "apples", or a cell reference.'},
      {name: 'Sumrange', description: 'The range of cells to sum. When omitted, the cells in Range are summed instead.'},
    ],
    examples: ['=SUMIF(A1:A10, ">5")', '=SUMIF(B1:B10, "apples", C1:C10)'],
  },
  SUMIFS: {
    category: 'Math and trigonometry',
    shortDescription: 'Sums up the values of cells that belong to the specified range and meet the specified sets of conditions.',
    parameters: [
      {name: 'Sum_Range', description: 'The range of cells to sum.'},
      {name: 'Criterion_range1', description: 'A range of cells tested against the paired criterion. Further criterion-range/criterion pairs can be passed as additional arguments; only cells that satisfy every pair are summed.'},
      {name: 'Criterion1', description: 'The condition applied to Criterion_range1, e.g. ">5", "apples", or a cell reference.'},
    ],
    examples: ['=SUMIFS(C1:C10, A1:A10, ">5", B1:B10, "apples")'],
  },
  SUMPRODUCT: {
    category: 'Math and trigonometry',
    shortDescription: 'Multiplies corresponding elements in the given arrays, and returns the sum of those products.',
    parameters: [{name: 'Array1', description: 'A range whose elements are multiplied element-wise with the corresponding elements of the other arrays before summing. Further same-sized ranges can be passed as additional arguments.'}],
    examples: ['=SUMPRODUCT(A1:A5, B1:B5)', '=SUMPRODUCT(A1:A3)'],
  },
  SUMSQ: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sum of the squares of the arguments',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range whose values are squared and summed. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=SUMSQ(3, 4)', '=SUMSQ(A1:A10)'],
  },
  SUMX2MY2: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sum of the square differences.',
    parameters: [
      {name: 'Range1', description: 'The range providing the first value (x) of each pair.'},
      {name: 'Range2', description: 'The range, of the same size as Range1, providing the second value (y) of each pair.'},
    ],
    examples: ['=SUMX2MY2(A1:A5, B1:B5)'],
  },
  SUMX2PY2: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sum of the square sums.',
    parameters: [
      {name: 'Range1', description: 'The range providing the first value (x) of each pair.'},
      {name: 'Range2', description: 'The range, of the same size as Range1, providing the second value (y) of each pair.'},
    ],
    examples: ['=SUMX2PY2(A1:A5, B1:B5)'],
  },
  SUMXMY2: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the sum of the square of differences.',
    parameters: [
      {name: 'Range1', description: 'The range providing the first value (x) of each pair.'},
      {name: 'Range2', description: 'The range, of the same size as Range1, providing the second value (y) of each pair.'},
    ],
    examples: ['=SUMXMY2(A1:A5, B1:B5)'],
  },
  TAN: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the tangent of the given angle (in radians).',
    parameters: [{name: 'Number', description: 'An angle in radians whose tangent is returned.'}],
    examples: ['=TAN(0)', '=TAN(PI()/4)'],
  },
  TANH: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the hyperbolic tangent of the given value.',
    parameters: [{name: 'Number', description: 'A number whose hyperbolic tangent is returned.'}],
    examples: ['=TANH(0)', '=TANH(1)'],
  },
}
