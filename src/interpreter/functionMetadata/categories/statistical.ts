/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Statistical" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`. The `examples` and parameter
 * descriptions are hand-authored; re-running that script overwrites them.
 */
export const STATISTICAL_DOCS: Record<string, FunctionDoc> = {
  AVEDEV: {
    category: 'Statistical',
    shortDescription: 'Returns the average deviation of the arguments.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range included in the deviation calculation. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=AVEDEV(1, 2, 3)', '=AVEDEV(A1:A10)'],
  },
  AVERAGE: {
    category: 'Statistical',
    shortDescription: 'Returns the average of the arguments.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range whose values are averaged. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=AVERAGE(1, 2, 3)', '=AVERAGE(A1:A10)'],
  },
  AVERAGEA: {
    category: 'Statistical',
    shortDescription: 'Returns the average of the arguments.',
    parameters: [{name: 'Value1', description: 'A value, cell reference, or range whose values are averaged; text and FALSE are treated as 0, and TRUE as 1. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=AVERAGEA(1, 2, TRUE)', '=AVERAGEA(A1:A10)'],
  },
  AVERAGEIF: {
    category: 'Statistical',
    shortDescription: 'Returns the arithmetic mean of all cells in a range that satisfy a given condition.',
    parameters: [
      {name: 'Range', description: 'The range of cells tested against the criterion.'},
      {name: 'Criterion', description: 'The condition that selects which cells are averaged, e.g. ">5", "apples", or a cell reference.'},
      {name: 'Average_Range', description: 'The range of cells to average. When omitted, the cells in Range are averaged instead.'},
    ],
    examples: ['=AVERAGEIF(A1:A10, ">5")', '=AVERAGEIF(B1:B10, "apples", C1:C10)'],
  },
  BESSELI: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [
      {name: 'X', description: 'The value at which the modified Bessel function is evaluated.'},
      {name: 'N', description: 'The order of the Bessel function; a non-negative integer.'},
    ],
    examples: ['=BESSELI(1.5, 1)'],
  },
  BESSELJ: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [
      {name: 'X', description: 'The value at which the Bessel function is evaluated.'},
      {name: 'N', description: 'The order of the Bessel function; a non-negative integer.'},
    ],
    examples: ['=BESSELJ(1.9, 2)'],
  },
  BESSELK: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [
      {name: 'X', description: 'The value at which the modified Bessel function is evaluated; must be greater than 0.'},
      {name: 'N', description: 'The order of the Bessel function; a non-negative integer.'},
    ],
    examples: ['=BESSELK(1.5, 1)'],
  },
  BESSELY: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [
      {name: 'X', description: 'The value at which the Bessel function is evaluated; must be greater than 0.'},
      {name: 'N', description: 'The order of the Bessel function; a non-negative integer.'},
    ],
    examples: ['=BESSELY(1.5, 1)'],
  },
  'BETA.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns the density of Beta distribution.',
    parameters: [
      {name: 'Number1', description: 'The value at which to evaluate the distribution, within the interval bounded by Number4 and Number5.'},
      {name: 'Number2', description: 'The alpha shape parameter of the distribution; must be greater than 0.'},
      {name: 'Number3', description: 'The beta shape parameter of the distribution; must be greater than 0.'},
      {name: 'Boolean', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
      {name: 'Number4', description: 'The lower bound of the interval of Number1; defaults to 0 when omitted.'},
      {name: 'Number5', description: 'The upper bound of the interval of Number1; defaults to 1 when omitted.'},
    ],
    examples: ['=BETA.DIST(0.5, 2, 3, TRUE)', '=BETA.DIST(2, 2, 3, FALSE, 0, 4)'],
  },
  'BETA.INV': {
    category: 'Statistical',
    shortDescription: 'Returns the inverse Beta distribution value.',
    parameters: [
      {name: 'Number1', description: 'The probability associated with the Beta distribution, between 0 and 1.'},
      {name: 'Number2', description: 'The alpha shape parameter of the distribution; must be greater than 0.'},
      {name: 'Number3', description: 'The beta shape parameter of the distribution; must be greater than 0.'},
      {name: 'Number4', description: 'The lower bound of the interval of the result; defaults to 0 when omitted.'},
      {name: 'Number5', description: 'The upper bound of the interval of the result; defaults to 1 when omitted.'},
    ],
    examples: ['=BETA.INV(0.5, 2, 3)', '=BETA.INV(0.25, 2, 3, 0, 4)'],
  },
  'BINOM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of binomial distribution.',
    parameters: [
      {name: 'Number1', description: 'The number of successes in the trials.'},
      {name: 'Number2', description: 'The total number of independent trials.'},
      {name: 'Number3', description: 'The probability of success on a single trial.'},
      {name: 'Boolean', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability mass function.'},
    ],
    examples: ['=BINOM.DIST(3, 10, 0.5, FALSE)', '=BINOM.DIST(3, 10, 0.5, TRUE)'],
  },
  'BINOM.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse binomial distribution value.',
    parameters: [
      {name: 'Number1', description: 'The total number of Bernoulli trials.'},
      {name: 'Number2', description: 'The probability of success on a single trial.'},
      {name: 'Number3', description: 'The criterion probability value; the function returns the smallest value for which the cumulative binomial distribution is greater than or equal to it.'},
    ],
    examples: ['=BINOM.INV(10, 0.5, 0.75)'],
  },
  'CHISQ.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns value of chi-square distribution.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution; must be non-negative.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
      {name: 'Mode', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
    ],
    examples: ['=CHISQ.DIST(2, 3, TRUE)', '=CHISQ.DIST(2, 3, FALSE)'],
  },
  'CHISQ.DIST.RT': {
    category: 'Statistical',
    shortDescription: 'Returns probability of chi-square right-side distribution.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution; must be non-negative.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
    ],
    examples: ['=CHISQ.DIST.RT(2, 3)'],
  },
  'CHISQ.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of chi-square distribution.',
    parameters: [
      {name: 'P', description: 'The probability associated with the chi-square distribution, between 0 and 1.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
    ],
    examples: ['=CHISQ.INV(0.9, 3)'],
  },
  'CHISQ.INV.RT': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of chi-square right-side distribution.',
    parameters: [
      {name: 'P', description: 'The right-tail probability associated with the chi-square distribution, between 0 and 1.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
    ],
    examples: ['=CHISQ.INV.RT(0.1, 3)'],
  },
  'CHISQ.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns chisquared-test value for a dataset.',
    parameters: [
      {name: 'Array1', description: 'The range of observed values.'},
      {name: 'Array2', description: 'The range of expected values, matching the size of Array1.'},
    ],
    examples: ['=CHISQ.TEST(A1:B3, D1:E3)'],
  },
  'CONFIDENCE.NORM': {
    category: 'Statistical',
    shortDescription: 'Returns upper confidence bound for normal distribution.',
    parameters: [
      {name: 'Alpha', description: 'The significance level used to compute the confidence level, between 0 and 1.'},
      {name: 'Stdev', description: 'The population standard deviation; must be greater than 0.'},
      {name: 'Size', description: 'The sample size.'},
    ],
    examples: ['=CONFIDENCE.NORM(0.05, 2.5, 50)'],
  },
  'CONFIDENCE.T': {
    category: 'Statistical',
    shortDescription: 'Returns upper confidence bound for T distribution.',
    parameters: [
      {name: 'Alpha', description: 'The significance level used to compute the confidence level, between 0 and 1.'},
      {name: 'Stdev', description: 'The sample standard deviation; must be greater than 0.'},
      {name: 'Size', description: 'The sample size.'},
    ],
    examples: ['=CONFIDENCE.T(0.05, 2.5, 10)'],
  },
  CORREL: {
    category: 'Statistical',
    shortDescription: 'Returns the correlation coefficient between two data sets.',
    parameters: [
      {name: 'Data1', description: 'The first range of numeric values.'},
      {name: 'Data2', description: 'The second range of numeric values, matching the size of Data1.'},
    ],
    examples: ['=CORREL(A1:A10, B1:B10)'],
  },
  COUNT: {
    category: 'Statistical',
    shortDescription: 'Counts how many numbers are in the list of arguments.',
    parameters: [{name: 'Value1', description: 'A number, cell reference, or range counted if it contains a number. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=COUNT(1, 2, "text")', '=COUNT(A1:A10)'],
  },
  COUNTA: {
    category: 'Statistical',
    shortDescription: 'Counts how many values are in the list of arguments.',
    parameters: [{name: 'Value1', description: 'A value, cell reference, or range counted if it is not empty. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=COUNTA(A1:A10)', '=COUNTA(1, "text", TRUE)'],
  },
  COUNTBLANK: {
    category: 'Statistical',
    shortDescription: 'Returns the number of empty cells.',
    parameters: [{name: 'Range', description: 'A value, cell reference, or range checked for emptiness. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=COUNTBLANK(A1:A10)', '=COUNTBLANK(A1:A10, C1:C10)'],
  },
  COUNTIF: {
    category: 'Statistical',
    shortDescription: 'Returns the number of cells that meet with certain criteria within a cell range.',
    parameters: [
      {name: 'Range', description: 'The range of cells tested against the criteria.'},
      {name: 'Criteria', description: 'The condition that selects which cells are counted, e.g. ">5", "apples", or a cell reference.'},
    ],
    examples: ['=COUNTIF(A1:A10, ">5")', '=COUNTIF(B1:B10, "apples")'],
  },
  COUNTIFS: {
    category: 'Statistical',
    shortDescription: 'Returns the count of rows or columns that meet criteria in multiple ranges.',
    parameters: [
      {name: 'Range1', description: 'A range of cells tested against the paired criterion. Further range/criterion pairs can be passed as additional arguments, and only cells meeting every criterion are counted.'},
      {name: 'Criterion1', description: 'The condition applied to the preceding range, e.g. ">5", "apples", or a cell reference.'},
    ],
    examples: ['=COUNTIFS(A1:A10, ">5")', '=COUNTIFS(A1:A10, ">5", B1:B10, "apples")'],
  },
  'COVARIANCE.P': {
    category: 'Statistical',
    shortDescription: 'Returns the covariance between two data sets, population normalized.',
    parameters: [
      {name: 'Data1', description: 'The first range of numeric values.'},
      {name: 'Data2', description: 'The second range of numeric values, matching the size of Data1.'},
    ],
    examples: ['=COVARIANCE.P(A1:A10, B1:B10)'],
  },
  'COVARIANCE.S': {
    category: 'Statistical',
    shortDescription: 'Returns the covariance between two data sets, sample normalized.',
    parameters: [
      {name: 'Data1', description: 'The first range of numeric values.'},
      {name: 'Data2', description: 'The second range of numeric values, matching the size of Data1.'},
    ],
    examples: ['=COVARIANCE.S(A1:A10, B1:B10)'],
  },
  DEVSQ: {
    category: 'Statistical',
    shortDescription: 'Returns sum of squared deviations.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range included in the sum of squared deviations. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=DEVSQ(1, 2, 3)', '=DEVSQ(A1:A10)'],
  },
  'EXPON.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of a exponential distribution.',
    parameters: [
      {name: 'Number1', description: 'The value at which to evaluate the distribution; must be non-negative.'},
      {name: 'Number2', description: 'The lambda rate parameter of the distribution; must be greater than 0.'},
      {name: 'Boolean', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
    ],
    examples: ['=EXPON.DIST(1, 0.5, TRUE)', '=EXPON.DIST(1, 0.5, FALSE)'],
  },
  'F.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns value of F distribution.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution; must be non-negative.'},
      {name: 'Degree1', description: 'The numerator degrees of freedom.'},
      {name: 'Degree2', description: 'The denominator degrees of freedom.'},
      {name: 'Mode', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
    ],
    examples: ['=F.DIST(2, 3, 10, TRUE)', '=F.DIST(2, 3, 10, FALSE)'],
  },
  'F.DIST.RT': {
    category: 'Statistical',
    shortDescription: 'Returns probability of F right-side distribution.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution; must be non-negative.'},
      {name: 'Degree1', description: 'The numerator degrees of freedom.'},
      {name: 'Degree2', description: 'The denominator degrees of freedom.'},
    ],
    examples: ['=F.DIST.RT(2, 3, 10)'],
  },
  'F.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of F distribution.',
    parameters: [
      {name: 'P', description: 'The probability associated with the F distribution, between 0 and 1.'},
      {name: 'Degree1', description: 'The numerator degrees of freedom.'},
      {name: 'Degree2', description: 'The denominator degrees of freedom.'},
    ],
    examples: ['=F.INV(0.9, 3, 10)'],
  },
  'F.INV.RT': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of F right-side distribution.',
    parameters: [
      {name: 'P', description: 'The right-tail probability associated with the F distribution, between 0 and 1.'},
      {name: 'Degree1', description: 'The numerator degrees of freedom.'},
      {name: 'Degree2', description: 'The denominator degrees of freedom.'},
    ],
    examples: ['=F.INV.RT(0.1, 3, 10)'],
  },
  'F.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns f-test value for a dataset.',
    parameters: [
      {name: 'Array1', description: 'The first range or array of sample values.'},
      {name: 'Array2', description: 'The second range or array of sample values.'},
    ],
    examples: ['=F.TEST(A1:A10, B1:B10)'],
  },
  FISHER: {
    category: 'Statistical',
    shortDescription: 'Returns Fisher transformation value.',
    parameters: [{name: 'Number', description: 'The value to transform; must be greater than -1 and less than 1.'}],
    examples: ['=FISHER(0.5)'],
  },
  FISHERINV: {
    category: 'Statistical',
    shortDescription: 'Returns inverse Fischer transformation value.',
    parameters: [{name: 'Number', description: 'The value of the Fisher transformation to invert.'}],
    examples: ['=FISHERINV(0.5)'],
  },
  GAMMA: {
    category: 'Statistical',
    shortDescription: 'Returns value of Gamma function.',
    parameters: [{name: 'Number', description: 'The value at which to evaluate the Gamma function; must not be zero or a negative integer.'}],
    examples: ['=GAMMA(5)'],
  },
  'GAMMA.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Gamma distribution.',
    parameters: [
      {name: 'Number1', description: 'The value at which to evaluate the distribution; must be non-negative.'},
      {name: 'Number2', description: 'The alpha shape parameter of the distribution; must be greater than 0.'},
      {name: 'Number3', description: 'The beta scale parameter of the distribution; must be greater than 0.'},
      {name: 'Boolean', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
    ],
    examples: ['=GAMMA.DIST(2, 1, 2, TRUE)', '=GAMMA.DIST(2, 1, 2, FALSE)'],
  },
  'GAMMA.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse Gamma distribution value.',
    parameters: [
      {name: 'Number1', description: 'The probability associated with the Gamma distribution, between 0 and 1.'},
      {name: 'Number2', description: 'The alpha shape parameter of the distribution; must be greater than 0.'},
      {name: 'Number3', description: 'The beta scale parameter of the distribution; must be greater than 0.'},
    ],
    examples: ['=GAMMA.INV(0.5, 1, 2)'],
  },
  GAMMALN: {
    category: 'Statistical',
    shortDescription: 'Returns natural logarithm of Gamma function.',
    parameters: [{name: 'Number', description: 'The value at which to evaluate the natural logarithm of the Gamma function; must be greater than 0.'}],
    examples: ['=GAMMALN(5)'],
  },
  GAUSS: {
    category: 'Statistical',
    shortDescription: 'Returns the probability of gaussian variable falling more than this many times standard deviation from mean.',
    parameters: [{name: 'Number', description: 'The number of standard deviations from the mean, Z, of a standard normal variable.'}],
    examples: ['=GAUSS(2)'],
  },
  GEOMEAN: {
    category: 'Statistical',
    shortDescription: 'Returns the geometric average.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range whose positive values are averaged geometrically. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=GEOMEAN(1, 2, 3)', '=GEOMEAN(A1:A10)'],
  },
  HARMEAN: {
    category: 'Statistical',
    shortDescription: 'Returns the harmonic average.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range whose positive values are averaged harmonically. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=HARMEAN(1, 2, 4)', '=HARMEAN(A1:A10)'],
  },
  'HYPGEOM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of hypergeometric distribution.',
    parameters: [
      {name: 'Number1', description: 'The number of successes in the sample.'},
      {name: 'Number2', description: 'The size of the sample.'},
      {name: 'Number3', description: 'The number of successes in the population.'},
      {name: 'Number4', description: 'The size of the population.'},
      {name: 'Boolean', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability mass function.'},
    ],
    examples: ['=HYPGEOM.DIST(1, 4, 8, 20, FALSE)', '=HYPGEOM.DIST(1, 4, 8, 20, TRUE)'],
  },
  LARGE: {
    category: 'Statistical',
    shortDescription: 'Returns k-th largest value in a range.',
    parameters: [
      {name: 'Range', description: 'The range of values to evaluate.'},
      {name: 'K', description: 'The position, from the largest, of the value to return; 1 returns the largest value.'},
    ],
    examples: ['=LARGE(A1:A10, 1)', '=LARGE(A1:A10, 3)'],
  },
  'LOGNORM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of lognormal distribution.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution; must be greater than 0.'},
      {name: 'Mean', description: 'The mean of the natural logarithm of the distribution.'},
      {name: 'Stddev', description: 'The standard deviation of the natural logarithm of the distribution; must be greater than 0.'},
      {name: 'Mode', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
    ],
    examples: ['=LOGNORM.DIST(4, 0, 1, TRUE)', '=LOGNORM.DIST(4, 0, 1, FALSE)'],
  },
  'LOGNORM.INV': {
    category: 'Statistical',
    shortDescription: 'Returns value of inverse lognormal distribution.',
    parameters: [
      {name: 'P', description: 'The probability associated with the lognormal distribution, between 0 and 1.'},
      {name: 'Mean', description: 'The mean of the natural logarithm of the distribution.'},
      {name: 'Stddev', description: 'The standard deviation of the natural logarithm of the distribution; must be greater than 0.'},
    ],
    examples: ['=LOGNORM.INV(0.5, 0, 1)'],
  },
  MAX: {
    category: 'Statistical',
    shortDescription: 'Returns the maximum value in a list of arguments.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range compared against the current maximum. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=MAX(1, 2, 3)', '=MAX(A1:A10)'],
  },
  MAXA: {
    category: 'Statistical',
    shortDescription: 'Returns the maximum value in a list of arguments.',
    parameters: [{name: 'Value1', description: 'A value, cell reference, or range compared against the current maximum; text and FALSE are treated as 0, and TRUE as 1. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=MAXA(1, TRUE, "text")', '=MAXA(A1:A10)'],
  },
  MAXIFS: {
    category: 'Statistical',
    shortDescription: 'Returns the maximum value of the cells in a range that meet a set of criteria.',
    parameters: [
      {name: 'Max_Range', description: 'The range of cells to evaluate for the maximum.'},
      {name: 'Criterion_range1', description: 'A range of cells tested against the paired criterion. Further range/criterion pairs can be passed as additional arguments, and only cells meeting every criterion are considered.'},
      {name: 'Criterion1', description: 'The condition applied to the preceding range, e.g. ">5", "apples", or a cell reference.'},
    ],
    examples: ['=MAXIFS(A1:A10, B1:B10, ">5")', '=MAXIFS(A1:A10, B1:B10, ">5", C1:C10, "apples")'],
  },
  MEDIAN: {
    category: 'Statistical',
    shortDescription: 'Returns the median of a set of numbers.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range included in the median calculation. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=MEDIAN(1, 2, 3)', '=MEDIAN(A1:A10)'],
  },
  MIN: {
    category: 'Statistical',
    shortDescription: 'Returns the minimum value in a list of arguments.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range compared against the current minimum. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=MIN(1, 2, 3)', '=MIN(A1:A10)'],
  },
  MINA: {
    category: 'Statistical',
    shortDescription: 'Returns the minimum value in a list of arguments.',
    parameters: [{name: 'Value1', description: 'A value, cell reference, or range compared against the current minimum; text and FALSE are treated as 0, and TRUE as 1. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=MINA(1, TRUE, "text")', '=MINA(A1:A10)'],
  },
  MINIFS: {
    category: 'Statistical',
    shortDescription: 'Returns the minimum value of the cells in a range that meet a set of criteria.',
    parameters: [
      {name: 'Min_Range', description: 'The range of cells to evaluate for the minimum.'},
      {name: 'Criterion_range1', description: 'A range of cells tested against the paired criterion. Further range/criterion pairs can be passed as additional arguments, and only cells meeting every criterion are considered.'},
      {name: 'Criterion1', description: 'The condition applied to the preceding range, e.g. ">5", "apples", or a cell reference.'},
    ],
    examples: ['=MINIFS(A1:A10, B1:B10, ">5")', '=MINIFS(A1:A10, B1:B10, ">5", C1:C10, "apples")'],
  },
  'NEGBINOM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of negative binomial distribution.',
    parameters: [
      {name: 'Number1', description: 'The number of failures.'},
      {name: 'Number2', description: 'The threshold number of successes.'},
      {name: 'Number3', description: 'The probability of success on a single trial.'},
      {name: 'Mode', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability mass function.'},
    ],
    examples: ['=NEGBINOM.DIST(3, 5, 0.5, FALSE)', '=NEGBINOM.DIST(3, 5, 0.5, TRUE)'],
  },
  'NORM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of normal distribution.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution.'},
      {name: 'Mean', description: 'The arithmetic mean of the distribution.'},
      {name: 'Stddev', description: 'The standard deviation of the distribution; must be greater than 0.'},
      {name: 'Mode', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
    ],
    examples: ['=NORM.DIST(1, 0, 1, TRUE)', '=NORM.DIST(1, 0, 1, FALSE)'],
  },
  'NORM.INV': {
    category: 'Statistical',
    shortDescription: 'Returns value of inverse normal distribution.',
    parameters: [
      {name: 'P', description: 'The probability associated with the normal distribution, between 0 and 1.'},
      {name: 'Mean', description: 'The arithmetic mean of the distribution.'},
      {name: 'Stddev', description: 'The standard deviation of the distribution; must be greater than 0.'},
    ],
    examples: ['=NORM.INV(0.5, 0, 1)'],
  },
  'NORM.S.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of normal distribution.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the standard normal distribution.'},
      {name: 'Mode', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
    ],
    examples: ['=NORM.S.DIST(1, TRUE)', '=NORM.S.DIST(1, FALSE)'],
  },
  'NORM.S.INV': {
    category: 'Statistical',
    shortDescription: 'Returns value of inverse normal distribution.',
    parameters: [{name: 'P', description: 'The probability associated with the standard normal distribution, between 0 and 1.'}],
    examples: ['=NORM.S.INV(0.5)'],
  },
  'PERCENTILE.EXC': {
    category: 'Statistical',
    shortDescription: 'Returns the k-th percentile of values in a range, exclusive of 0 and 1.',
    parameters: [
      {name: 'Data', description: 'The range of values to evaluate.'},
      {name: 'K', description: 'The percentile to return, exclusive of 0 and 1, e.g. 0.25.'},
    ],
    examples: ['=PERCENTILE.EXC(A1:A10, 0.25)'],
  },
  'PERCENTILE.INC': {
    category: 'Statistical',
    shortDescription: 'Returns the k-th percentile of values in a range, inclusive of 0 and 1.',
    parameters: [
      {name: 'Data', description: 'The range of values to evaluate.'},
      {name: 'K', description: 'The percentile to return, inclusive of 0 and 1, e.g. 0.9.'},
    ],
    examples: ['=PERCENTILE.INC(A1:A10, 0.9)'],
  },
  PHI: {
    category: 'Statistical',
    shortDescription: 'Returns probability densitity of normal distribution.',
    parameters: [{name: 'X', description: 'The value at which to evaluate the standard normal probability density function.'}],
    examples: ['=PHI(1)'],
  },
  'POISSON.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Poisson distribution.',
    parameters: [
      {name: 'X', description: 'The number of events; must be non-negative.'},
      {name: 'Mean', description: 'The expected number of events; must be greater than 0.'},
      {name: 'Mode', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability mass function.'},
    ],
    examples: ['=POISSON.DIST(3, 5, FALSE)', '=POISSON.DIST(3, 5, TRUE)'],
  },
  'QUARTILE.EXC': {
    category: 'Statistical',
    shortDescription: 'Returns the quartile of a data set, based on exclusive percentile values.',
    parameters: [
      {name: 'Data', description: 'The range of values to evaluate.'},
      {name: 'Quart', description: 'The quartile to return, exclusive of 0 and 4, an integer from 1 to 3.'},
    ],
    examples: ['=QUARTILE.EXC(A1:A10, 1)'],
  },
  'QUARTILE.INC': {
    category: 'Statistical',
    shortDescription: 'Returns the quartile of a data set, based on inclusive percentile values.',
    parameters: [
      {name: 'Data', description: 'The range of values to evaluate.'},
      {name: 'Quart', description: 'The quartile to return, inclusive of 0 and 4, an integer from 0 to 4.'},
    ],
    examples: ['=QUARTILE.INC(A1:A10, 3)'],
  },
  RSQ: {
    category: 'Statistical',
    shortDescription: 'Returns the squared correlation coefficient between two data sets.',
    parameters: [
      {name: 'Data1', description: 'The range of dependent (y) values.'},
      {name: 'Data2', description: 'The range of independent (x) values, matching the size of Data1.'},
    ],
    examples: ['=RSQ(A1:A10, B1:B10)'],
  },
  SKEW: {
    category: 'Statistical',
    shortDescription: 'Returns skeweness of a sample.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range included in the sample skewness calculation. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=SKEW(1, 2, 3, 10)', '=SKEW(A1:A10)'],
  },
  'SKEW.P': {
    category: 'Statistical',
    shortDescription: 'Returns skeweness of a population.',
    parameters: [{name: 'Number1', description: 'A number, cell reference, or range included in the population skewness calculation. Further numbers or ranges can be passed as additional arguments.'}],
    examples: ['=SKEW.P(1, 2, 3, 10)', '=SKEW.P(A1:A10)'],
  },
  SLOPE: {
    category: 'Statistical',
    shortDescription: 'Returns the slope of a linear regression line.',
    parameters: [
      {name: 'Array1', description: 'The range of dependent (y) values.'},
      {name: 'Array2', description: 'The range of independent (x) values, matching the size of Array1.'},
    ],
    examples: ['=SLOPE(A1:A10, B1:B10)'],
  },
  SMALL: {
    category: 'Statistical',
    shortDescription: 'Returns k-th smallest value in a range.',
    parameters: [
      {name: 'Range', description: 'The range of values to evaluate.'},
      {name: 'K', description: 'The position, from the smallest, of the value to return; 1 returns the smallest value.'},
    ],
    examples: ['=SMALL(A1:A10, 1)', '=SMALL(A1:A10, 3)'],
  },
  STANDARDIZE: {
    category: 'Statistical',
    shortDescription: 'Returns normalized value wrt expected value and standard deviation.',
    parameters: [
      {name: 'X', description: 'The value to normalize.'},
      {name: 'Mean', description: 'The arithmetic mean of the distribution.'},
      {name: 'Stddev', description: 'The standard deviation of the distribution; must be greater than 0.'},
    ],
    examples: ['=STANDARDIZE(5, 3, 2)'],
  },
  'STDEV.P': {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a population.',
    parameters: [{name: 'Value1', description: 'A number, cell reference, or range included in the population standard deviation calculation. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=STDEV.P(1, 2, 3)', '=STDEV.P(A1:A10)'],
  },
  'STDEV.S': {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a sample.',
    parameters: [{name: 'Value1', description: 'A number, cell reference, or range included in the sample standard deviation calculation. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=STDEV.S(1, 2, 3)', '=STDEV.S(A1:A10)'],
  },
  STDEVA: {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a sample.',
    parameters: [{name: 'Value1', description: 'A value, cell reference, or range included in the sample standard deviation calculation; text and FALSE are treated as 0, and TRUE as 1. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=STDEVA(1, TRUE, 3)', '=STDEVA(A1:A10)'],
  },
  STDEVPA: {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a population.',
    parameters: [{name: 'Value1', description: 'A value, cell reference, or range included in the population standard deviation calculation; text and FALSE are treated as 0, and TRUE as 1. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=STDEVPA(1, TRUE, 3)', '=STDEVPA(A1:A10)'],
  },
  STEYX: {
    category: 'Statistical',
    shortDescription: 'Returns standard error for predicted of the predicted y value for each x value.',
    parameters: [
      {name: 'Array1', description: 'The range of dependent (y) values.'},
      {name: 'Array2', description: 'The range of independent (x) values, matching the size of Array1.'},
    ],
    examples: ['=STEYX(A1:A10, B1:B10)'],
  },
  'T.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
      {name: 'Mode', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
    ],
    examples: ['=T.DIST(1, 10, TRUE)', '=T.DIST(1, 10, FALSE)'],
  },
  'T.DIST.2T': {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution, both-sided.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution; must be non-negative.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
    ],
    examples: ['=T.DIST.2T(1, 10)'],
  },
  'T.DIST.RT': {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution, right-tailed.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
    ],
    examples: ['=T.DIST.RT(1, 10)'],
  },
  'T.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse Student-t distribution.',
    parameters: [
      {name: 'P', description: 'The probability associated with the left-tailed Student-t distribution, between 0 and 1.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
    ],
    examples: ['=T.INV(0.9, 10)'],
  },
  'T.INV.2T': {
    category: 'Statistical',
    shortDescription: 'Returns inverse Student-t distribution, both-sided.',
    parameters: [
      {name: 'P', description: 'The probability associated with the two-tailed Student-t distribution, between 0 and 1.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
    ],
    examples: ['=T.INV.2T(0.1, 10)'],
  },
  'T.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns t-test value for a dataset.',
    parameters: [
      {name: 'Array1', description: 'The first range or array of sample values.'},
      {name: 'Array2', description: 'The second range or array of sample values.'},
      {name: 'Tails', description: 'The number of distribution tails to use: 1 for a one-tailed test, or 2 for a two-tailed test.'},
      {name: 'Type', description: 'The kind of t-test to perform: 1 for paired, 2 for two-sample equal variance, or 3 for two-sample unequal variance.'},
    ],
    examples: ['=T.TEST(A1:A10, B1:B10, 2, 1)'],
  },
  TDIST: {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution, both-sided or right-tailed.',
    parameters: [
      {name: 'X', description: 'The value at which to evaluate the distribution; must be non-negative.'},
      {name: 'Degrees', description: 'The number of degrees of freedom.'},
      {name: 'Mode', description: 'The number of distribution tails to return: 1 for right-tailed, or 2 for two-tailed.'},
    ],
    examples: ['=TDIST(1, 10, 1)', '=TDIST(1, 10, 2)'],
  },
  'VAR.P': {
    category: 'Statistical',
    shortDescription: 'Returns variance of a population.',
    parameters: [{name: 'Value1', description: 'A number, cell reference, or range included in the population variance calculation. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=VAR.P(1, 2, 3)', '=VAR.P(A1:A10)'],
  },
  'VAR.S': {
    category: 'Statistical',
    shortDescription: 'Returns variance of a sample.',
    parameters: [{name: 'Value1', description: 'A number, cell reference, or range included in the sample variance calculation. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=VAR.S(1, 2, 3)', '=VAR.S(A1:A10)'],
  },
  VARA: {
    category: 'Statistical',
    shortDescription: 'Returns variance of a sample.',
    parameters: [{name: 'Value1', description: 'A value, cell reference, or range included in the sample variance calculation; text and FALSE are treated as 0, and TRUE as 1. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=VARA(1, TRUE, 3)', '=VARA(A1:A10)'],
  },
  VARPA: {
    category: 'Statistical',
    shortDescription: 'Returns variance of a population.',
    parameters: [{name: 'Value1', description: 'A value, cell reference, or range included in the population variance calculation; text and FALSE are treated as 0, and TRUE as 1. Further values or ranges can be passed as additional arguments.'}],
    examples: ['=VARPA(1, TRUE, 3)', '=VARPA(A1:A10)'],
  },
  'WEIBULL.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Weibull distribution.',
    parameters: [
      {name: 'Number1', description: 'The value at which to evaluate the distribution; must be non-negative.'},
      {name: 'Number2', description: 'The alpha shape parameter of the distribution; must be greater than 0.'},
      {name: 'Number3', description: 'The beta scale parameter of the distribution; must be greater than 0.'},
      {name: 'Boolean', description: 'TRUE returns the cumulative distribution function; FALSE returns the probability density function.'},
    ],
    examples: ['=WEIBULL.DIST(2, 1, 2, TRUE)', '=WEIBULL.DIST(2, 1, 2, FALSE)'],
  },
  'Z.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns z-test value for a dataset.',
    parameters: [
      {name: 'Array', description: 'The range or array of sample values to test against.'},
      {name: 'X', description: 'The value to test.'},
      {name: 'Sigma', description: 'The known population standard deviation; when omitted, the sample standard deviation of Array is used instead.'},
    ],
    examples: ['=Z.TEST(A1:A10, 5)', '=Z.TEST(A1:A10, 5, 2)'],
  },
}
