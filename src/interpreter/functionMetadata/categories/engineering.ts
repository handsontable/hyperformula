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
    parameters: [{name: 'Number', description: ''}],
  },
  BIN2HEX: {
    category: 'Engineering',
    shortDescription: 'The result is the hexadecimal number for the binary number entered.',
    parameters: [{name: 'Number', description: ''}, {name: 'Places', description: ''}],
  },
  BIN2OCT: {
    category: 'Engineering',
    shortDescription: 'The result is the octal number for the binary number entered.',
    parameters: [{name: 'Number', description: ''}, {name: 'Places', description: ''}],
  },
  BITAND: {
    category: 'Engineering',
    shortDescription: 'Returns a bitwise logical "and" of the parameters.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}],
  },
  BITLSHIFT: {
    category: 'Engineering',
    shortDescription: 'Shifts a number left by n bits.',
    parameters: [{name: 'Number', description: ''}, {name: 'Shift', description: ''}],
  },
  BITOR: {
    category: 'Engineering',
    shortDescription: 'Returns a bitwise logical "or" of the parameters.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}],
  },
  BITRSHIFT: {
    category: 'Engineering',
    shortDescription: 'Shifts a number right by n bits.',
    parameters: [{name: 'Number', description: ''}, {name: 'Shift', description: ''}],
  },
  BITXOR: {
    category: 'Engineering',
    shortDescription: 'Returns a bitwise logical "exclusive or" of the parameters.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}],
  },
  COMPLEX: {
    category: 'Engineering',
    shortDescription: 'Returns complex number from Re and Im parts.',
    parameters: [{name: 'Re', description: ''}, {name: 'Im', description: ''}, {name: 'Symbol', description: ''}],
  },
  DEC2BIN: {
    category: 'Engineering',
    shortDescription: 'Returns the binary number for the decimal number entered between –512 and 511.',
    parameters: [{name: 'Number', description: ''}, {name: 'Places', description: ''}],
  },
  DEC2HEX: {
    category: 'Engineering',
    shortDescription: 'Returns the hexadecimal number for the decimal number entered.',
    parameters: [{name: 'Number', description: ''}, {name: 'Places', description: ''}],
  },
  DEC2OCT: {
    category: 'Engineering',
    shortDescription: 'Returns the octal number for the decimal number entered.',
    parameters: [{name: 'Number', description: ''}, {name: 'Places', description: ''}],
  },
  DELTA: {
    category: 'Engineering',
    shortDescription: 'Returns TRUE (1) if both numbers are equal, otherwise returns FALSE (0).',
    parameters: [{name: 'Number_1', description: ''}, {name: 'Number_2', description: ''}],
  },
  ERF: {
    category: 'Engineering',
    shortDescription: 'Returns values of the Gaussian error integral.',
    parameters: [{name: 'Lower_Limit', description: ''}, {name: 'Upper_Limit', description: ''}],
  },
  ERFC: {
    category: 'Engineering',
    shortDescription: 'Returns complementary values of the Gaussian error integral between x and infinity.',
    parameters: [{name: 'Lower_Limit', description: ''}],
  },
  HEX2BIN: {
    category: 'Engineering',
    shortDescription: 'The result is the binary number for the hexadecimal number entered.',
    parameters: [{name: 'Number', description: ''}, {name: 'Places', description: ''}],
  },
  HEX2DEC: {
    category: 'Engineering',
    shortDescription: 'The result is the decimal number for the hexadecimal number entered.',
    parameters: [{name: 'Number', description: ''}],
  },
  HEX2OCT: {
    category: 'Engineering',
    shortDescription: 'The result is the octal number for the hexadecimal number entered.',
    parameters: [{name: 'Number', description: ''}, {name: 'Places', description: ''}],
  },
  IMABS: {
    category: 'Engineering',
    shortDescription: 'Returns modulus of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMAGINARY: {
    category: 'Engineering',
    shortDescription: 'Returns imaginary part of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMARGUMENT: {
    category: 'Engineering',
    shortDescription: 'Returns argument of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMCONJUGATE: {
    category: 'Engineering',
    shortDescription: 'Returns conjugate of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMCOS: {
    category: 'Engineering',
    shortDescription: 'Returns cosine of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMCOSH: {
    category: 'Engineering',
    shortDescription: 'Returns hyperbolic cosine of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMCOT: {
    category: 'Engineering',
    shortDescription: 'Returns cotangent of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMCSC: {
    category: 'Engineering',
    shortDescription: 'Returns cosecant of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMCSCH: {
    category: 'Engineering',
    shortDescription: 'Returns hyperbolic cosecant of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMDIV: {
    category: 'Engineering',
    shortDescription: 'Divides two complex numbers.',
    parameters: [{name: 'Complex1', description: ''}, {name: 'Complex2', description: ''}],
  },
  IMEXP: {
    category: 'Engineering',
    shortDescription: 'Returns exponent of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMLN: {
    category: 'Engineering',
    shortDescription: 'Returns natural logarithm of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMLOG10: {
    category: 'Engineering',
    shortDescription: 'Returns base-10 logarithm of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMLOG2: {
    category: 'Engineering',
    shortDescription: 'Returns binary logarithm of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMPOWER: {
    category: 'Engineering',
    shortDescription: 'Returns a complex number raised to a given power.',
    parameters: [{name: 'Complex', description: ''}, {name: 'Number', description: ''}],
  },
  IMPRODUCT: {
    category: 'Engineering',
    shortDescription: 'Multiplies complex numbers.',
    parameters: [{name: 'Complex1', description: ''}],
  },
  IMREAL: {
    category: 'Engineering',
    shortDescription: 'Returns real part of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMSEC: {
    category: 'Engineering',
    shortDescription: 'Returns the secant of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMSECH: {
    category: 'Engineering',
    shortDescription: 'Returns the hyperbolic secant of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMSIN: {
    category: 'Engineering',
    shortDescription: 'Returns sine of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMSINH: {
    category: 'Engineering',
    shortDescription: 'Returns hyperbolic sine of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMSQRT: {
    category: 'Engineering',
    shortDescription: 'Returns a square root of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  IMSUB: {
    category: 'Engineering',
    shortDescription: 'Subtracts two complex numbers.',
    parameters: [{name: 'Complex1', description: ''}, {name: 'Complex2', description: ''}],
  },
  IMSUM: {
    category: 'Engineering',
    shortDescription: 'Adds complex numbers.',
    parameters: [{name: 'Complex1', description: ''}],
  },
  IMTAN: {
    category: 'Engineering',
    shortDescription: 'Returns the tangent of a complex number.',
    parameters: [{name: 'Complex', description: ''}],
  },
  OCT2BIN: {
    category: 'Engineering',
    shortDescription: 'The result is the binary number for the octal number entered.',
    parameters: [{name: 'Number', description: ''}, {name: 'Places', description: ''}],
  },
  OCT2DEC: {
    category: 'Engineering',
    shortDescription: 'The result is the decimal number for the octal number entered.',
    parameters: [{name: 'Number', description: ''}],
  },
  OCT2HEX: {
    category: 'Engineering',
    shortDescription: 'The result is the hexadecimal number for the octal number entered.',
    parameters: [{name: 'Number', description: ''}, {name: 'Places', description: ''}],
  },
}
