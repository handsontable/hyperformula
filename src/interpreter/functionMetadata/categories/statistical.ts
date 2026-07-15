/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Statistical" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const STATISTICAL_DOCS: Record<string, FunctionDoc> = {
  AVEDEV: {
    category: 'Statistical',
    shortDescription: 'Returns the average deviation of the arguments.',
    parameters: [{name: 'number1', description: ''}],
  },
  AVERAGE: {
    category: 'Statistical',
    shortDescription: 'Returns the average of the arguments.',
    parameters: [{name: 'number1', description: ''}],
  },
  AVERAGEA: {
    category: 'Statistical',
    shortDescription: 'Returns the average of the arguments.',
    parameters: [{name: 'value1', description: ''}],
  },
  AVERAGEIF: {
    category: 'Statistical',
    shortDescription: 'Returns the arithmetic mean of all cells in a range that satisfy a given condition.',
    parameters: [{name: 'range', description: ''}, {name: 'criterion', description: ''}, {name: 'average_range', description: ''}],
  },
  BESSELI: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [{name: 'x', description: ''}, {name: 'n', description: ''}],
  },
  BESSELJ: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [{name: 'x', description: ''}, {name: 'n', description: ''}],
  },
  BESSELK: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [{name: 'x', description: ''}, {name: 'n', description: ''}],
  },
  BESSELY: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [{name: 'x', description: ''}, {name: 'n', description: ''}],
  },
  'BETA.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns the density of Beta distribution.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}, {name: 'boolean', description: ''}, {name: 'number4', description: ''}, {name: 'number5', description: ''}],
  },
  'BETA.INV': {
    category: 'Statistical',
    shortDescription: 'Returns the inverse Beta distribution value.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}, {name: 'number4', description: ''}, {name: 'number5', description: ''}],
  },
  'BINOM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of binomial distribution.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}, {name: 'boolean', description: ''}],
  },
  'BINOM.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse binomial distribution value.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}],
  },
  'CHISQ.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns value of chi-square distribution.',
    parameters: [{name: 'x', description: ''}, {name: 'degrees', description: ''}, {name: 'mode', description: ''}],
  },
  'CHISQ.DIST.RT': {
    category: 'Statistical',
    shortDescription: 'Returns probability of chi-square right-side distribution.',
    parameters: [{name: 'x', description: ''}, {name: 'degrees', description: ''}],
  },
  'CHISQ.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of chi-square distribution.',
    parameters: [{name: 'p', description: ''}, {name: 'degrees', description: ''}],
  },
  'CHISQ.INV.RT': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of chi-square right-side distribution.',
    parameters: [{name: 'p', description: ''}, {name: 'degrees', description: ''}],
  },
  'CHISQ.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns chisquared-test value for a dataset.',
    parameters: [{name: 'array1', description: ''}, {name: 'array2', description: ''}],
  },
  'CONFIDENCE.NORM': {
    category: 'Statistical',
    shortDescription: 'Returns upper confidence bound for normal distribution.',
    parameters: [{name: 'alpha', description: ''}, {name: 'stdev', description: ''}, {name: 'size', description: ''}],
  },
  'CONFIDENCE.T': {
    category: 'Statistical',
    shortDescription: 'Returns upper confidence bound for T distribution.',
    parameters: [{name: 'alpha', description: ''}, {name: 'stdev', description: ''}, {name: 'size', description: ''}],
  },
  CORREL: {
    category: 'Statistical',
    shortDescription: 'Returns the correlation coefficient between two data sets.',
    parameters: [{name: 'data1', description: ''}, {name: 'data2', description: ''}],
  },
  COUNT: {
    category: 'Statistical',
    shortDescription: 'Counts how many numbers are in the list of arguments.',
    parameters: [{name: 'value1', description: ''}],
  },
  COUNTA: {
    category: 'Statistical',
    shortDescription: 'Counts how many values are in the list of arguments.',
    parameters: [{name: 'value1', description: ''}],
  },
  COUNTBLANK: {
    category: 'Statistical',
    shortDescription: 'Returns the number of empty cells.',
    parameters: [{name: 'range', description: ''}],
  },
  COUNTIF: {
    category: 'Statistical',
    shortDescription: 'Returns the number of cells that meet with certain criteria within a cell range.',
    parameters: [{name: 'range', description: ''}, {name: 'criteria', description: ''}],
  },
  COUNTIFS: {
    category: 'Statistical',
    shortDescription: 'Returns the count of rows or columns that meet criteria in multiple ranges.',
    parameters: [{name: 'range1', description: ''}, {name: 'criterion1', description: ''}],
  },
  'COVARIANCE.P': {
    category: 'Statistical',
    shortDescription: 'Returns the covariance between two data sets, population normalized.',
    parameters: [{name: 'data1', description: ''}, {name: 'data2', description: ''}],
  },
  'COVARIANCE.S': {
    category: 'Statistical',
    shortDescription: 'Returns the covariance between two data sets, sample normalized.',
    parameters: [{name: 'data1', description: ''}, {name: 'data2', description: ''}],
  },
  DEVSQ: {
    category: 'Statistical',
    shortDescription: 'Returns sum of squared deviations.',
    parameters: [{name: 'number1', description: ''}],
  },
  'EXPON.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of a exponential distribution.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'boolean', description: ''}],
  },
  'F.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns value of F distribution.',
    parameters: [{name: 'x', description: ''}, {name: 'degree1', description: ''}, {name: 'degree2', description: ''}, {name: 'mode', description: ''}],
  },
  'F.DIST.RT': {
    category: 'Statistical',
    shortDescription: 'Returns probability of F right-side distribution.',
    parameters: [{name: 'x', description: ''}, {name: 'degree1', description: ''}, {name: 'degree2', description: ''}],
  },
  'F.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of F distribution.',
    parameters: [{name: 'p', description: ''}, {name: 'degree1', description: ''}, {name: 'degree2', description: ''}],
  },
  'F.INV.RT': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of F right-side distribution.',
    parameters: [{name: 'p', description: ''}, {name: 'degree1', description: ''}, {name: 'degree2', description: ''}],
  },
  'F.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns f-test value for a dataset.',
    parameters: [{name: 'array1', description: ''}, {name: 'array2', description: ''}],
  },
  FISHER: {
    category: 'Statistical',
    shortDescription: 'Returns Fisher transformation value.',
    parameters: [{name: 'number', description: ''}],
  },
  FISHERINV: {
    category: 'Statistical',
    shortDescription: 'Returns inverse Fisher transformation value.',
    parameters: [{name: 'number', description: ''}],
  },
  GAMMA: {
    category: 'Statistical',
    shortDescription: 'Returns value of Gamma function.',
    parameters: [{name: 'number', description: ''}],
  },
  'GAMMA.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Gamma distribution.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}, {name: 'boolean', description: ''}],
  },
  'GAMMA.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse Gamma distribution value.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}],
  },
  GAMMALN: {
    category: 'Statistical',
    shortDescription: 'Returns natural logarithm of Gamma function.',
    parameters: [{name: 'number', description: ''}],
  },
  GAUSS: {
    category: 'Statistical',
    shortDescription: 'Returns the probability of gaussian variable falling more than this many times standard deviation from mean.',
    parameters: [{name: 'number', description: ''}],
  },
  GEOMEAN: {
    category: 'Statistical',
    shortDescription: 'Returns the geometric average.',
    parameters: [{name: 'number1', description: ''}],
  },
  HARMEAN: {
    category: 'Statistical',
    shortDescription: 'Returns the harmonic average.',
    parameters: [{name: 'number1', description: ''}],
  },
  'HYPGEOM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of hypergeometric distribution.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}, {name: 'number4', description: ''}, {name: 'boolean', description: ''}],
  },
  LARGE: {
    category: 'Statistical',
    shortDescription: 'Returns k-th largest value in a range.',
    parameters: [{name: 'range', description: ''}, {name: 'k', description: ''}],
  },
  'LOGNORM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of lognormal distribution.',
    parameters: [{name: 'x', description: ''}, {name: 'mean', description: ''}, {name: 'stddev', description: ''}, {name: 'mode', description: ''}],
  },
  'LOGNORM.INV': {
    category: 'Statistical',
    shortDescription: 'Returns value of inverse lognormal distribution.',
    parameters: [{name: 'p', description: ''}, {name: 'mean', description: ''}, {name: 'stddev', description: ''}],
  },
  MAX: {
    category: 'Statistical',
    shortDescription: 'Returns the maximum value in a list of arguments.',
    parameters: [{name: 'number1', description: ''}],
  },
  MAXA: {
    category: 'Statistical',
    shortDescription: 'Returns the maximum value in a list of arguments.',
    parameters: [{name: 'value1', description: ''}],
  },
  MAXIFS: {
    category: 'Statistical',
    shortDescription: 'Returns the maximum value of the cells in a range that meet a set of criteria.',
    parameters: [{name: 'max_range', description: ''}, {name: 'criterion_range1', description: ''}, {name: 'criterion1', description: ''}],
  },
  MEDIAN: {
    category: 'Statistical',
    shortDescription: 'Returns the median of a set of numbers.',
    parameters: [{name: 'number1', description: ''}],
  },
  MIN: {
    category: 'Statistical',
    shortDescription: 'Returns the minimum value in a list of arguments.',
    parameters: [{name: 'number1', description: ''}],
  },
  MINA: {
    category: 'Statistical',
    shortDescription: 'Returns the minimum value in a list of arguments.',
    parameters: [{name: 'value1', description: ''}],
  },
  MINIFS: {
    category: 'Statistical',
    shortDescription: 'Returns the minimum value of the cells in a range that meet a set of criteria.',
    parameters: [{name: 'min_range', description: ''}, {name: 'criterion_range1', description: ''}, {name: 'criterion1', description: ''}],
  },
  'NEGBINOM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of negative binomial distribution.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}, {name: 'mode', description: ''}],
  },
  'NORM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of normal distribution.',
    parameters: [{name: 'x', description: ''}, {name: 'mean', description: ''}, {name: 'stddev', description: ''}, {name: 'mode', description: ''}],
  },
  'NORM.INV': {
    category: 'Statistical',
    shortDescription: 'Returns value of inverse normal distribution.',
    parameters: [{name: 'p', description: ''}, {name: 'mean', description: ''}, {name: 'stddev', description: ''}],
  },
  'NORM.S.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of normal distribution.',
    parameters: [{name: 'x', description: ''}, {name: 'mode', description: ''}],
  },
  'NORM.S.INV': {
    category: 'Statistical',
    shortDescription: 'Returns value of inverse normal distribution.',
    parameters: [{name: 'p', description: ''}],
  },
  'PERCENTILE.EXC': {
    category: 'Statistical',
    shortDescription: 'Returns the k-th percentile of values in a range, exclusive of 0 and 1.',
    parameters: [{name: 'data', description: ''}, {name: 'k', description: ''}],
  },
  'PERCENTILE.INC': {
    category: 'Statistical',
    shortDescription: 'Returns the k-th percentile of values in a range, inclusive of 0 and 1.',
    parameters: [{name: 'data', description: ''}, {name: 'k', description: ''}],
  },
  PHI: {
    category: 'Statistical',
    shortDescription: 'Returns probability density of normal distribution.',
    parameters: [{name: 'x', description: ''}],
  },
  'POISSON.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Poisson distribution.',
    parameters: [{name: 'x', description: ''}, {name: 'mean', description: ''}, {name: 'mode', description: ''}],
  },
  'QUARTILE.EXC': {
    category: 'Statistical',
    shortDescription: 'Returns the quartile of a data set, based on exclusive percentile values.',
    parameters: [{name: 'data', description: ''}, {name: 'quart', description: ''}],
  },
  'QUARTILE.INC': {
    category: 'Statistical',
    shortDescription: 'Returns the quartile of a data set, based on inclusive percentile values.',
    parameters: [{name: 'data', description: ''}, {name: 'quart', description: ''}],
  },
  RSQ: {
    category: 'Statistical',
    shortDescription: 'Returns the squared correlation coefficient between two data sets.',
    parameters: [{name: 'data1', description: ''}, {name: 'data2', description: ''}],
  },
  SKEW: {
    category: 'Statistical',
    shortDescription: 'Returns skewness of a sample.',
    parameters: [{name: 'number1', description: ''}],
  },
  'SKEW.P': {
    category: 'Statistical',
    shortDescription: 'Returns skewness of a population.',
    parameters: [{name: 'number1', description: ''}],
  },
  SLOPE: {
    category: 'Statistical',
    shortDescription: 'Returns the slope of a linear regression line.',
    parameters: [{name: 'array1', description: ''}, {name: 'array2', description: ''}],
  },
  SMALL: {
    category: 'Statistical',
    shortDescription: 'Returns k-th smallest value in a range.',
    parameters: [{name: 'range', description: ''}, {name: 'k', description: ''}],
  },
  STANDARDIZE: {
    category: 'Statistical',
    shortDescription: 'Returns normalized value wrt expected value and standard deviation.',
    parameters: [{name: 'x', description: ''}, {name: 'mean', description: ''}, {name: 'stddev', description: ''}],
  },
  'STDEV.P': {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a population.',
    parameters: [{name: 'value1', description: ''}],
  },
  'STDEV.S': {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a sample.',
    parameters: [{name: 'value1', description: ''}],
  },
  STDEVA: {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a sample.',
    parameters: [{name: 'value1', description: ''}],
  },
  STDEVPA: {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a population.',
    parameters: [{name: 'value1', description: ''}],
  },
  STEYX: {
    category: 'Statistical',
    shortDescription: 'Returns standard error for predicted of the predicted y value for each x value.',
    parameters: [{name: 'array1', description: ''}, {name: 'array2', description: ''}],
  },
  'T.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution.',
    parameters: [{name: 'x', description: ''}, {name: 'degrees', description: ''}, {name: 'mode', description: ''}],
  },
  'T.DIST.2T': {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution, both-sided.',
    parameters: [{name: 'x', description: ''}, {name: 'degrees', description: ''}],
  },
  'T.DIST.RT': {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution, right-tailed.',
    parameters: [{name: 'x', description: ''}, {name: 'degrees', description: ''}],
  },
  'T.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse Student-t distribution.',
    parameters: [{name: 'p', description: ''}, {name: 'degrees', description: ''}],
  },
  'T.INV.2T': {
    category: 'Statistical',
    shortDescription: 'Returns inverse Student-t distribution, both-sided.',
    parameters: [{name: 'p', description: ''}, {name: 'degrees', description: ''}],
  },
  'T.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns t-test value for a dataset.',
    parameters: [{name: 'array1', description: ''}, {name: 'array2', description: ''}, {name: 'tails', description: ''}, {name: 'type', description: ''}],
  },
  TDIST: {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution, both-sided or right-tailed.',
    parameters: [{name: 'x', description: ''}, {name: 'degrees', description: ''}, {name: 'mode', description: ''}],
  },
  'VAR.P': {
    category: 'Statistical',
    shortDescription: 'Returns variance of a population.',
    parameters: [{name: 'value1', description: ''}],
  },
  'VAR.S': {
    category: 'Statistical',
    shortDescription: 'Returns variance of a sample.',
    parameters: [{name: 'value1', description: ''}],
  },
  VARA: {
    category: 'Statistical',
    shortDescription: 'Returns variance of a sample.',
    parameters: [{name: 'value1', description: ''}],
  },
  VARPA: {
    category: 'Statistical',
    shortDescription: 'Returns variance of a population.',
    parameters: [{name: 'value1', description: ''}],
  },
  'WEIBULL.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Weibull distribution.',
    parameters: [{name: 'number1', description: ''}, {name: 'number2', description: ''}, {name: 'number3', description: ''}, {name: 'boolean', description: ''}],
  },
  'Z.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns z-test value for a dataset.',
    parameters: [{name: 'array', description: ''}, {name: 'x', description: ''}, {name: 'sigma', description: ''}],
  },
}
