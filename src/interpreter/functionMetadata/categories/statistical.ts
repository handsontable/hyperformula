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
    parameters: [{name: 'Number1', description: ''}],
  },
  AVERAGE: {
    category: 'Statistical',
    shortDescription: 'Returns the average of the arguments.',
    parameters: [{name: 'Number1', description: ''}],
  },
  AVERAGEA: {
    category: 'Statistical',
    shortDescription: 'Returns the average of the arguments.',
    parameters: [{name: 'Value1', description: ''}],
  },
  AVERAGEIF: {
    category: 'Statistical',
    shortDescription: 'Returns the arithmetic mean of all cells in a range that satisfy a given condition.',
    parameters: [{name: 'Range', description: ''}, {name: 'Criterion', description: ''}, {name: 'Average_Range', description: ''}],
  },
  BESSELI: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [{name: 'X', description: ''}, {name: 'N', description: ''}],
  },
  BESSELJ: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [{name: 'X', description: ''}, {name: 'N', description: ''}],
  },
  BESSELK: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [{name: 'X', description: ''}, {name: 'N', description: ''}],
  },
  BESSELY: {
    category: 'Statistical',
    shortDescription: 'Returns value of Bessel function.',
    parameters: [{name: 'X', description: ''}, {name: 'N', description: ''}],
  },
  'BETA.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns the density of Beta distribution.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Number3', description: ''}, {name: 'Boolean', description: ''}, {name: 'Number4', description: ''}, {name: 'Number5', description: ''}],
  },
  'BETA.INV': {
    category: 'Statistical',
    shortDescription: 'Returns the inverse Beta distribution value.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Number3', description: ''}, {name: 'Number4', description: ''}, {name: 'Number5', description: ''}],
  },
  'BINOM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of binomial distribution.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Number3', description: ''}, {name: 'Boolean', description: ''}],
  },
  'BINOM.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse binomial distribution value.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Number3', description: ''}],
  },
  'CHISQ.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns value of chi-square distribution.',
    parameters: [{name: 'X', description: ''}, {name: 'Degrees', description: ''}, {name: 'Mode', description: ''}],
  },
  'CHISQ.DIST.RT': {
    category: 'Statistical',
    shortDescription: 'Returns probability of chi-square right-side distribution.',
    parameters: [{name: 'X', description: ''}, {name: 'Degrees', description: ''}],
  },
  'CHISQ.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of chi-square distribution.',
    parameters: [{name: 'P', description: ''}, {name: 'Degrees', description: ''}],
  },
  'CHISQ.INV.RT': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of chi-square right-side distribution.',
    parameters: [{name: 'P', description: ''}, {name: 'Degrees', description: ''}],
  },
  'CHISQ.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns chisquared-test value for a dataset.',
    parameters: [{name: 'Array1', description: ''}, {name: 'Array2', description: ''}],
  },
  'CONFIDENCE.NORM': {
    category: 'Statistical',
    shortDescription: 'Returns upper confidence bound for normal distribution.',
    parameters: [{name: 'Alpha', description: ''}, {name: 'Stdev', description: ''}, {name: 'Size', description: ''}],
  },
  'CONFIDENCE.T': {
    category: 'Statistical',
    shortDescription: 'Returns upper confidence bound for T distribution.',
    parameters: [{name: 'Alpha', description: ''}, {name: 'Stdev', description: ''}, {name: 'Size', description: ''}],
  },
  CORREL: {
    category: 'Statistical',
    shortDescription: 'Returns the correlation coefficient between two data sets.',
    parameters: [{name: 'Data1', description: ''}, {name: 'Data2', description: ''}],
  },
  COUNT: {
    category: 'Statistical',
    shortDescription: 'Counts how many numbers are in the list of arguments.',
    parameters: [{name: 'Value1', description: ''}],
  },
  COUNTA: {
    category: 'Statistical',
    shortDescription: 'Counts how many values are in the list of arguments.',
    parameters: [{name: 'Value1', description: ''}],
  },
  COUNTBLANK: {
    category: 'Statistical',
    shortDescription: 'Returns the number of empty cells.',
    parameters: [{name: 'Range', description: ''}],
  },
  COUNTIF: {
    category: 'Statistical',
    shortDescription: 'Returns the number of cells that meet with certain criteria within a cell range.',
    parameters: [{name: 'Range', description: ''}, {name: 'Criteria', description: ''}],
  },
  COUNTIFS: {
    category: 'Statistical',
    shortDescription: 'Returns the count of rows or columns that meet criteria in multiple ranges.',
    parameters: [{name: 'Range1', description: ''}, {name: 'Criterion1', description: ''}],
  },
  'COVARIANCE.P': {
    category: 'Statistical',
    shortDescription: 'Returns the covariance between two data sets, population normalized.',
    parameters: [{name: 'Data1', description: ''}, {name: 'Data2', description: ''}],
  },
  'COVARIANCE.S': {
    category: 'Statistical',
    shortDescription: 'Returns the covariance between two data sets, sample normalized.',
    parameters: [{name: 'Data1', description: ''}, {name: 'Data2', description: ''}],
  },
  DEVSQ: {
    category: 'Statistical',
    shortDescription: 'Returns sum of squared deviations.',
    parameters: [{name: 'Number1', description: ''}],
  },
  'EXPON.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of a exponential distribution.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Boolean', description: ''}],
  },
  'F.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns value of F distribution.',
    parameters: [{name: 'X', description: ''}, {name: 'Degree1', description: ''}, {name: 'Degree2', description: ''}, {name: 'Mode', description: ''}],
  },
  'F.DIST.RT': {
    category: 'Statistical',
    shortDescription: 'Returns probability of F right-side distribution.',
    parameters: [{name: 'X', description: ''}, {name: 'Degree1', description: ''}, {name: 'Degree2', description: ''}],
  },
  'F.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of F distribution.',
    parameters: [{name: 'P', description: ''}, {name: 'Degree1', description: ''}, {name: 'Degree2', description: ''}],
  },
  'F.INV.RT': {
    category: 'Statistical',
    shortDescription: 'Returns inverse of F right-side distribution.',
    parameters: [{name: 'P', description: ''}, {name: 'Degree1', description: ''}, {name: 'Degree2', description: ''}],
  },
  'F.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns f-test value for a dataset.',
    parameters: [{name: 'Array1', description: ''}, {name: 'Array2', description: ''}],
  },
  FISHER: {
    category: 'Statistical',
    shortDescription: 'Returns Fisher transformation value.',
    parameters: [{name: 'Number', description: ''}],
  },
  FISHERINV: {
    category: 'Statistical',
    shortDescription: 'Returns inverse Fischer transformation value.',
    parameters: [{name: 'Number', description: ''}],
  },
  GAMMA: {
    category: 'Statistical',
    shortDescription: 'Returns value of Gamma function.',
    parameters: [{name: 'Number', description: ''}],
  },
  'GAMMA.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Gamma distribution.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Number3', description: ''}, {name: 'Boolean', description: ''}],
  },
  'GAMMA.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse Gamma distribution value.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Number3', description: ''}],
  },
  GAMMALN: {
    category: 'Statistical',
    shortDescription: 'Returns natural logarithm of Gamma function.',
    parameters: [{name: 'Number', description: ''}],
  },
  GAUSS: {
    category: 'Statistical',
    shortDescription: 'Returns the probability of gaussian variable falling more than this many times standard deviation from mean.',
    parameters: [{name: 'Number', description: ''}],
  },
  GEOMEAN: {
    category: 'Statistical',
    shortDescription: 'Returns the geometric average.',
    parameters: [{name: 'Number1', description: ''}],
  },
  HARMEAN: {
    category: 'Statistical',
    shortDescription: 'Returns the harmonic average.',
    parameters: [{name: 'Number1', description: ''}],
  },
  'HYPGEOM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of hypergeometric distribution.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Number3', description: ''}, {name: 'Number4', description: ''}, {name: 'Boolean', description: ''}],
  },
  LARGE: {
    category: 'Statistical',
    shortDescription: 'Returns k-th largest value in a range.',
    parameters: [{name: 'Range', description: ''}, {name: 'K', description: ''}],
  },
  'LOGNORM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of lognormal distribution.',
    parameters: [{name: 'X', description: ''}, {name: 'Mean', description: ''}, {name: 'Stddev', description: ''}, {name: 'Mode', description: ''}],
  },
  'LOGNORM.INV': {
    category: 'Statistical',
    shortDescription: 'Returns value of inverse lognormal distribution.',
    parameters: [{name: 'P', description: ''}, {name: 'Mean', description: ''}, {name: 'Stddev', description: ''}],
  },
  MAX: {
    category: 'Statistical',
    shortDescription: 'Returns the maximum value in a list of arguments.',
    parameters: [{name: 'Number1', description: ''}],
  },
  MAXA: {
    category: 'Statistical',
    shortDescription: 'Returns the maximum value in a list of arguments.',
    parameters: [{name: 'Value1', description: ''}],
  },
  MAXIFS: {
    category: 'Statistical',
    shortDescription: 'Returns the maximum value of the cells in a range that meet a set of criteria.',
    parameters: [{name: 'Max_Range', description: ''}, {name: 'Criterion_range1', description: ''}, {name: 'Criterion1', description: ''}],
  },
  MEDIAN: {
    category: 'Statistical',
    shortDescription: 'Returns the median of a set of numbers.',
    parameters: [{name: 'Number1', description: ''}],
  },
  MIN: {
    category: 'Statistical',
    shortDescription: 'Returns the minimum value in a list of arguments.',
    parameters: [{name: 'Number1', description: ''}],
  },
  MINA: {
    category: 'Statistical',
    shortDescription: 'Returns the minimum value in a list of arguments.',
    parameters: [{name: 'Value1', description: ''}],
  },
  MINIFS: {
    category: 'Statistical',
    shortDescription: 'Returns the minimum value of the cells in a range that meet a set of criteria.',
    parameters: [{name: 'Min_Range', description: ''}, {name: 'Criterion_range1', description: ''}, {name: 'Criterion1', description: ''}],
  },
  'NEGBINOM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of negative binomial distribution.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Number3', description: ''}, {name: 'Mode', description: ''}],
  },
  'NORM.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of normal distribution.',
    parameters: [{name: 'X', description: ''}, {name: 'Mean', description: ''}, {name: 'Stddev', description: ''}, {name: 'Mode', description: ''}],
  },
  'NORM.INV': {
    category: 'Statistical',
    shortDescription: 'Returns value of inverse normal distribution.',
    parameters: [{name: 'P', description: ''}, {name: 'Mean', description: ''}, {name: 'Stddev', description: ''}],
  },
  'NORM.S.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of normal distribution.',
    parameters: [{name: 'X', description: ''}, {name: 'Mode', description: ''}],
  },
  'NORM.S.INV': {
    category: 'Statistical',
    shortDescription: 'Returns value of inverse normal distribution.',
    parameters: [{name: 'P', description: ''}],
  },
  'PERCENTILE.EXC': {
    category: 'Statistical',
    shortDescription: 'Returns the k-th percentile of values in a range, exclusive of 0 and 1.',
    parameters: [{name: 'Data', description: ''}, {name: 'K', description: ''}],
  },
  'PERCENTILE.INC': {
    category: 'Statistical',
    shortDescription: 'Returns the k-th percentile of values in a range, inclusive of 0 and 1.',
    parameters: [{name: 'Data', description: ''}, {name: 'K', description: ''}],
  },
  PHI: {
    category: 'Statistical',
    shortDescription: 'Returns probability densitity of normal distribution.',
    parameters: [{name: 'X', description: ''}],
  },
  'POISSON.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Poisson distribution.',
    parameters: [{name: 'X', description: ''}, {name: 'Mean', description: ''}, {name: 'Mode', description: ''}],
  },
  'QUARTILE.EXC': {
    category: 'Statistical',
    shortDescription: 'Returns the quartile of a data set, based on exclusive percentile values.',
    parameters: [{name: 'Data', description: ''}, {name: 'Quart', description: ''}],
  },
  'QUARTILE.INC': {
    category: 'Statistical',
    shortDescription: 'Returns the quartile of a data set, based on inclusive percentile values.',
    parameters: [{name: 'Data', description: ''}, {name: 'Quart', description: ''}],
  },
  RSQ: {
    category: 'Statistical',
    shortDescription: 'Returns the squared correlation coefficient between two data sets.',
    parameters: [{name: 'Data1', description: ''}, {name: 'Data2', description: ''}],
  },
  SKEW: {
    category: 'Statistical',
    shortDescription: 'Returns skeweness of a sample.',
    parameters: [{name: 'Number1', description: ''}],
  },
  'SKEW.P': {
    category: 'Statistical',
    shortDescription: 'Returns skeweness of a population.',
    parameters: [{name: 'Number1', description: ''}],
  },
  SLOPE: {
    category: 'Statistical',
    shortDescription: 'Returns the slope of a linear regression line.',
    parameters: [{name: 'Array1', description: ''}, {name: 'Array2', description: ''}],
  },
  SMALL: {
    category: 'Statistical',
    shortDescription: 'Returns k-th smallest value in a range.',
    parameters: [{name: 'Range', description: ''}, {name: 'K', description: ''}],
  },
  STANDARDIZE: {
    category: 'Statistical',
    shortDescription: 'Returns normalized value wrt expected value and standard deviation.',
    parameters: [{name: 'X', description: ''}, {name: 'Mean', description: ''}, {name: 'Stddev', description: ''}],
  },
  'STDEV.P': {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a population.',
    parameters: [{name: 'Value1', description: ''}],
  },
  'STDEV.S': {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a sample.',
    parameters: [{name: 'Value1', description: ''}],
  },
  STDEVA: {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a sample.',
    parameters: [{name: 'Value1', description: ''}],
  },
  STDEVPA: {
    category: 'Statistical',
    shortDescription: 'Returns standard deviation of a population.',
    parameters: [{name: 'Value1', description: ''}],
  },
  STEYX: {
    category: 'Statistical',
    shortDescription: 'Returns standard error for predicted of the predicted y value for each x value.',
    parameters: [{name: 'Array1', description: ''}, {name: 'Array2', description: ''}],
  },
  'T.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution.',
    parameters: [{name: 'X', description: ''}, {name: 'Degrees', description: ''}, {name: 'Mode', description: ''}],
  },
  'T.DIST.2T': {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution, both-sided.',
    parameters: [{name: 'X', description: ''}, {name: 'Degrees', description: ''}],
  },
  'T.DIST.RT': {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution, right-tailed.',
    parameters: [{name: 'X', description: ''}, {name: 'Degrees', description: ''}],
  },
  'T.INV': {
    category: 'Statistical',
    shortDescription: 'Returns inverse Student-t distribution.',
    parameters: [{name: 'P', description: ''}, {name: 'Degrees', description: ''}],
  },
  'T.INV.2T': {
    category: 'Statistical',
    shortDescription: 'Returns inverse Student-t distribution, both-sided.',
    parameters: [{name: 'P', description: ''}, {name: 'Degrees', description: ''}],
  },
  'T.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns t-test value for a dataset.',
    parameters: [{name: 'Array1', description: ''}, {name: 'Array2', description: ''}, {name: 'Tails', description: ''}, {name: 'Type', description: ''}],
  },
  TDIST: {
    category: 'Statistical',
    shortDescription: 'Returns density of Student-t distribution, both-sided or right-tailed.',
    parameters: [{name: 'X', description: ''}, {name: 'Degrees', description: ''}, {name: 'Mode', description: ''}],
  },
  'VAR.P': {
    category: 'Statistical',
    shortDescription: 'Returns variance of a population.',
    parameters: [{name: 'Value1', description: ''}],
  },
  'VAR.S': {
    category: 'Statistical',
    shortDescription: 'Returns variance of a sample.',
    parameters: [{name: 'Value1', description: ''}],
  },
  VARA: {
    category: 'Statistical',
    shortDescription: 'Returns variance of a sample.',
    parameters: [{name: 'Value1', description: ''}],
  },
  VARPA: {
    category: 'Statistical',
    shortDescription: 'Returns variance of a population.',
    parameters: [{name: 'Value1', description: ''}],
  },
  'WEIBULL.DIST': {
    category: 'Statistical',
    shortDescription: 'Returns density of Weibull distribution.',
    parameters: [{name: 'Number1', description: ''}, {name: 'Number2', description: ''}, {name: 'Number3', description: ''}, {name: 'Boolean', description: ''}],
  },
  'Z.TEST': {
    category: 'Statistical',
    shortDescription: 'Returns z-test value for a dataset.',
    parameters: [{name: 'Array', description: ''}, {name: 'X', description: ''}, {name: 'Sigma', description: ''}],
  },
}
