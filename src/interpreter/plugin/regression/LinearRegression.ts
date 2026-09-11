/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/** Numerical fit and uncertainties, before spreadsheet output formatting. */
export interface LinearRegressionResult {
  coefficients: number[],
  intercept: number,
  standardErrors: number[],
  interceptError: number,
  residualSumSquares: number,
  totalSumSquares: number,
  degreesOfFreedom: number,
  retainedPredictorCount: number,
}

/** A predictor column with its original position and pre-factorization norm. */
interface RegressionColumn {
  values: number[],
  index: number,
  originalNorm: number,
}

/**
 * Rank threshold relative to a predictor's original centered norm.
 * Excel Online retains a 1e-5 perturbation of a duplicated predictor and removes 1e-6.
 * Keep the threshold separate from roundoff handling for the fitted statistics.
 */
const RANK_TOLERANCE = 1e-6

/** Computes a Euclidean norm without squaring large inputs or spreading an unbounded range. */
function norm(values: number[], start = 0): number {
  let result = 0
  for (let i = start; i < values.length; i++) {
    result = Math.hypot(result, values[i])
  }
  return result
}

/** Computes the mean relative to the first value to preserve small changes on large offsets. */
function mean(values: number[]): number {
  const origin = values[0]
  let sum = 0
  for (const value of values) {
    sum += (value - origin) / values.length
  }
  return origin + sum
}

/** Applies a Householder reflection to the trailing part of a column. */
function reflect(values: number[], vector: number[], start: number, factor: number): void {
  let product = 0
  for (let i = start; i < values.length; i++) {
    product += vector[i - start] * values[i]
  }
  product *= factor
  for (let i = start; i < values.length; i++) {
    values[i] -= product * vector[i - start]
  }
}

/** Solves the retained triangular system, treating an exactly zero predictor as a zero coefficient. */
function backSubstitute(columns: RegressionColumn[], count: number, right: number[]): number[] {
  const solution = Array<number>(count).fill(0)
  for (let i = count - 1; i >= 0; i--) {
    if (columns[i].values[i] === 0) {
      continue
    }
    let value = right[i]
    for (let j = i + 1; j < count; j++) {
      value -= columns[j].values[i] * solution[j]
    }
    solution[i] = value / columns[i].values[i]
  }
  return solution
}

/**
 * Fits observations using pivoted Householder QR, with a fixed leading intercept column.
 * Predictor centering preserves accuracy for large offsets. The factorization is column-major,
 * uses O(n*k + k*k) storage, and costs O(n*k*k) for n >= k; Q is never materialized.
 *
 * Exactly zero predictors intentionally consume an available QR slot. Excel Online returns a
 * zero coefficient but still excludes that transformed response entry from residual statistics.
 * A dependent nonzero predictor is instead removed using its relative norm, increasing df.
 *
 * @param predictors - observation rows, with predictor columns in their original order
 * @param observations - numeric response for each observation
 * @param fitIntercept - whether to include a constant term
 * @param statistics - whether to compute coefficient uncertainties
 */
export function fitLinearRegression(predictors: number[][], observations: number[], fitIntercept: boolean, statistics: boolean): LinearRegressionResult {
  const n = observations.length
  const k = predictors[0].length
  const offset = fitIntercept ? 1 : 0
  const means = Array<number>(k).fill(0)
  const columns: RegressionColumn[] = []
  if (fitIntercept) {
    columns.push({values: Array<number>(n).fill(1), index: -1, originalNorm: Math.sqrt(n)})
  }
  for (let j = 0; j < k; j++) {
    const values = predictors.map(row => row[j])
    means[j] = fitIntercept ? mean(values) : 0
    const centered = values.map(value => value - means[j])
    columns.push({values: centered, index: j, originalNorm: norm(centered)})
  }

  // Treat the intercept as the last input column moved to the front by a swap.
  // Retain this order when pivot norms tie, so duplicated predictors agree with Excel.
  if (fitIntercept && k > 1) {
    const firstPredictor = columns.splice(1, 1)[0]
    columns.push(firstPredictor)
  }
  // Remove a common response offset before reflection to preserve small variations.
  const responseOrigin = fitIntercept ? observations[0] : 0
  const transformedY = observations.map(value => value - responseOrigin)
  let remaining = columns.length
  let count = 0
  while (count < Math.min(n, remaining)) {
    if (count >= offset) {
      let selected = count
      let largest = -1
      for (let j = count; j < remaining; j++) {
        const magnitude = norm(columns[j].values, count)
        if (magnitude > largest) {
          largest = magnitude
          selected = j
        }
      }
      [columns[count], columns[selected]] = [columns[selected], columns[count]]
    }
    const column = columns[count]
    const magnitude = norm(column.values, count)
    if (count >= offset && magnitude < RANK_TOLERANCE * column.originalNorm) {
      remaining--
      columns[count] = columns[remaining]
      columns[remaining] = column
      continue
    }
    if (magnitude !== 0) {
      const sign = column.values[count] >= 0 ? 1 : -1
      const vector = column.values.slice(count).map(value => value / magnitude)
      vector[0] += sign
      const factor = 1 / (1 + Math.abs(column.values[count]) / magnitude)
      for (let j = count + 1; j < remaining; j++) {
        reflect(columns[j].values, vector, count, factor)
      }
      reflect(transformedY, vector, count, factor)
      column.values[count] = -sign * magnitude
      column.values.fill(0, count + 1)
    }
    count++
  }

  const solution = backSubstitute(columns, count, transformedY)
  const coefficients = Array<number>(k).fill(0)
  for (let j = offset; j < count; j++) {
    coefficients[columns[j].index] = solution[j]
  }
  const intercept = fitIntercept ? mean(observations) - coefficients.reduce((sum, value, j) => sum + value * means[j], 0) : 0
  const yMean = fitIntercept ? mean(observations) : 0
  const centeredY = observations.map(value => value - yMean)
  const totalSumSquares = norm(centeredY) ** 2
  let residualSumSquares = norm(transformedY, count) ** 2
  // Simple exact fits have zero residual statistics in Excel. Discard only
  // reflection roundoff, whose squared scale is O((n * machine epsilon)^2).
  const simpleFitRoundoff = k === 1 && residualSumSquares <= totalSumSquares * (n * Number.EPSILON) ** 2
  if (totalSumSquares === 0 || count === n || simpleFitRoundoff) {
    residualSumSquares = 0
  }
  const degreesOfFreedom = n - count
  const variance = degreesOfFreedom === 0 ? 0 : residualSumSquares / degreesOfFreedom
  const standardErrors = Array<number>(k).fill(0)
  let interceptError = 0
  if (statistics && variance !== 0) {
    const residualStandardError = Math.sqrt(variance)
    // Each solve produces one column of R^-1 without a full covariance matrix.
    // Accumulate scaled uncertainty magnitudes with hypot: squaring first can
    // overflow or underflow even when the final standard error is representable.
    for (let j = 0; j < count; j++) {
      const right = Array<number>(count).fill(0)
      right[j] = 1
      const inverseColumn = backSubstitute(columns, count, right)
      let interceptWeight = fitIntercept ? inverseColumn[0] : 0
      for (let i = offset; i < count; i++) {
        const original = columns[i].index
        standardErrors[original] = Math.hypot(standardErrors[original], residualStandardError * inverseColumn[i])
        interceptWeight -= means[original] * inverseColumn[i]
      }
      interceptError = Math.hypot(interceptError, residualStandardError * interceptWeight)
    }
  }
  return {
    coefficients,
    intercept,
    standardErrors,
    interceptError,
    residualSumSquares,
    totalSumSquares,
    degreesOfFreedom,
    retainedPredictorCount: count - offset,
  }
}
