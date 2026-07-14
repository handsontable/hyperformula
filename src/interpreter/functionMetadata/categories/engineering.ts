/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Engineering" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const ENGINEERING_DOCS: Record<string, FunctionDoc> = {
  BIN2DEC: {
    category: 'Engineering',
    shortDescription: 'The result is the decimal number for the binary number entered.',
    parameters: [{name: 'number', description: ''}],
  },
  BIN2HEX: {
    category: 'Engineering',
    shortDescription: 'The result is the hexadecimal number for the binary number entered.',
    parameters: [{name: 'number', description: ''}, {name: 'places', description: ''}],
  },
  BIN2OCT: {
    category: 'Engineering',
    shortDescription: 'The result is the octal number for the binary number entered.',
    parameters: [{name: 'number', description: ''}, {name: 'places', description: ''}],
  },
  BITAND: {
    category: 'Engineering',
    shortDescription: 'Returns a bitwise logical "and" of the parameters.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  BITLSHIFT: {
    category: 'Engineering',
    shortDescription: 'Shifts a number left by n bits.',
    parameters: [{name: 'number', description: ''}, {name: 'shift', description: ''}],
  },
  BITOR: {
    category: 'Engineering',
    shortDescription: 'Returns a bitwise logical "or" of the parameters.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  BITRSHIFT: {
    category: 'Engineering',
    shortDescription: 'Shifts a number right by n bits.',
    parameters: [{name: 'number', description: ''}, {name: 'shift', description: ''}],
  },
  BITXOR: {
    category: 'Engineering',
    shortDescription: 'Returns a bitwise logical "exclusive or" of the parameters.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  COMPLEX: {
    category: 'Engineering',
    shortDescription: 'Returns complex number from Re and Im parts.',
    parameters: [{name: 're', description: ''}, {name: 'im', description: ''}, {name: 'symbol', description: ''}],
  },
  DEC2BIN: {
    category: 'Engineering',
    shortDescription: 'Returns the binary number for the decimal number entered between –512 and 511.',
    parameters: [{name: 'number', description: ''}, {name: 'places', description: ''}],
  },
  DEC2HEX: {
    category: 'Engineering',
    shortDescription: 'Returns the hexadecimal number for the decimal number entered.',
    parameters: [{name: 'number', description: ''}, {name: 'places', description: ''}],
  },
  DEC2OCT: {
    category: 'Engineering',
    shortDescription: 'Returns the octal number for the decimal number entered.',
    parameters: [{name: 'number', description: ''}, {name: 'places', description: ''}],
  },
  DELTA: {
    category: 'Engineering',
    shortDescription: 'Returns TRUE (1) if both numbers are equal, otherwise returns FALSE (0).',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}],
  },
  ERF: {
    category: 'Engineering',
    shortDescription: 'Returns values of the Gaussian error integral.',
    parameters: [{name: 'lower_limit', description: ''}, {name: 'upper_limit', description: ''}],
  },
  ERFC: {
    category: 'Engineering',
    shortDescription: 'Returns complementary values of the Gaussian error integral between x and infinity.',
    parameters: [{name: 'lower_limit', description: ''}],
  },
  HEX2BIN: {
    category: 'Engineering',
    shortDescription: 'The result is the binary number for the hexadecimal number entered.',
    parameters: [{name: 'number', description: ''}, {name: 'places', description: ''}],
  },
  HEX2DEC: {
    category: 'Engineering',
    shortDescription: 'The result is the decimal number for the hexadecimal number entered.',
    parameters: [{name: 'number', description: ''}],
  },
  HEX2OCT: {
    category: 'Engineering',
    shortDescription: 'The result is the octal number for the hexadecimal number entered.',
    parameters: [{name: 'number', description: ''}, {name: 'places', description: ''}],
  },
  IMABS: {
    category: 'Engineering',
    shortDescription: 'Returns modulus of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMAGINARY: {
    category: 'Engineering',
    shortDescription: 'Returns imaginary part of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMARGUMENT: {
    category: 'Engineering',
    shortDescription: 'Returns argument of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMCONJUGATE: {
    category: 'Engineering',
    shortDescription: 'Returns conjugate of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMCOS: {
    category: 'Engineering',
    shortDescription: 'Returns cosine of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMCOSH: {
    category: 'Engineering',
    shortDescription: 'Returns hyperbolic cosine of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMCOT: {
    category: 'Engineering',
    shortDescription: 'Returns cotangent of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMCSC: {
    category: 'Engineering',
    shortDescription: 'Returns cosecant of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMCSCH: {
    category: 'Engineering',
    shortDescription: 'Returns hyperbolic cosecant of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMDIV: {
    category: 'Engineering',
    shortDescription: 'Divides two complex numbers.',
    parameters: [{name: 'complex1', description: ''}, {name: 'complex2', description: ''}],
  },
  IMEXP: {
    category: 'Engineering',
    shortDescription: 'Returns exponent of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMLN: {
    category: 'Engineering',
    shortDescription: 'Returns natural logarithm of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMLOG10: {
    category: 'Engineering',
    shortDescription: 'Returns base-10 logarithm of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMLOG2: {
    category: 'Engineering',
    shortDescription: 'Returns binary logarithm of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMPOWER: {
    category: 'Engineering',
    shortDescription: 'Returns a complex number raised to a given power.',
    parameters: [{name: 'complex', description: ''}, {name: 'number', description: ''}],
  },
  IMPRODUCT: {
    category: 'Engineering',
    shortDescription: 'Multiplies complex numbers.',
    parameters: [{name: 'complex1', description: ''}],
  },
  IMREAL: {
    category: 'Engineering',
    shortDescription: 'Returns real part of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMSEC: {
    category: 'Engineering',
    shortDescription: 'Returns the secant of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMSECH: {
    category: 'Engineering',
    shortDescription: 'Returns the hyperbolic secant of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMSIN: {
    category: 'Engineering',
    shortDescription: 'Returns sine of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMSINH: {
    category: 'Engineering',
    shortDescription: 'Returns hyperbolic sine of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMSQRT: {
    category: 'Engineering',
    shortDescription: 'Returns a square root of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  IMSUB: {
    category: 'Engineering',
    shortDescription: 'Subtracts two complex numbers.',
    parameters: [{name: 'complex1', description: ''}, {name: 'complex2', description: ''}],
  },
  IMSUM: {
    category: 'Engineering',
    shortDescription: 'Adds complex numbers.',
    parameters: [{name: 'complex1', description: ''}],
  },
  IMTAN: {
    category: 'Engineering',
    shortDescription: 'Returns the tangent of a complex number.',
    parameters: [{name: 'complex', description: ''}],
  },
  OCT2BIN: {
    category: 'Engineering',
    shortDescription: 'The result is the binary number for the octal number entered.',
    parameters: [{name: 'number', description: ''}, {name: 'places', description: ''}],
  },
  OCT2DEC: {
    category: 'Engineering',
    shortDescription: 'The result is the decimal number for the octal number entered.',
    parameters: [{name: 'number', description: ''}],
  },
  OCT2HEX: {
    category: 'Engineering',
    shortDescription: 'The result is the hexadecimal number for the octal number entered.',
    parameters: [{name: 'number', description: ''}, {name: 'places', description: ''}],
  },
}
