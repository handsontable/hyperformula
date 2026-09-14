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

/**
 * Column-major storage: columns[columnIndex].values[rowIndex] is a matrix entry.
 * Factorization overwrites the values with the triangular system. predictorIndex
 * preserves the original predictor position through swaps; -1 identifies the intercept.
 */
interface RegressionColumn {
  values: number[],
  predictorIndex: number,
  /** Norm after optional centering, before any reflections. */
  originalNorm: number,
}

/** A reflection and the leading value it produces in the selected column tail. */
interface HouseholderReflection {
  vector: number[],
  factor: number,
  diagonalValue: number,
}

/** Coefficient uncertainties restored to the original predictor order. */
interface CoefficientStandardErrors {
  standardErrors: number[],
  interceptError: number,
}

/**
 * Rank threshold relative to a predictor's original centered norm.
 * Excel Online retains a 1e-5 perturbation of a duplicated predictor and removes 1e-6.
 * Keep the threshold separate from roundoff handling for the fitted statistics.
 */
const RANK_TOLERANCE = 1e-6

/** Computes a Euclidean norm without squaring large inputs or spreading an unbounded range. */
function norm(values: number[], startRow = 0): number {
  let result = 0
  for (let rowIndex = startRow; rowIndex < values.length; rowIndex++) {
    result = Math.hypot(result, values[rowIndex])
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

/**
 * Constructs a reflection for a nonzero column tail without modifying the column.
 *
 * Let x = values.slice(startRow), r = magnitude, and e0 = [1, 0, ...].
 * Choose s = 1 when x[0] >= 0, otherwise -1.
 * The vector v = x / r + s * e0 reflects x to [-s * r, 0, ...]. Adding the same
 * sign avoids cancellation when constructing v's first entry.
 * Its squared length is v^T * v = 2 * (1 + abs(x[0]) / r), so the reflection
 * factor 2 / (v^T * v) simplifies to 1 / (1 + abs(x[0]) / r).
 *
 * @param values - selected column, including any already processed rows
 * @param startRow - first row of the column tail to reflect
 * @param magnitude - nonzero norm of values starting at startRow, already computed by the caller
 */
function createHouseholderReflection(values: number[], startRow: number, magnitude: number): HouseholderReflection {
  const sign = values[startRow] >= 0 ? 1 : -1
  const vector = values.slice(startRow).map(value => value / magnitude)
  vector[0] += sign
  const factor = 1 / (1 + Math.abs(values[startRow]) / magnitude)
  return {vector, factor, diagonalValue: -sign * magnitude}
}

/**
 * Applies a Householder reflection to values starting at startRow, in place.
 *
 * For the active tail w and reflection vector v, with ^T denoting transpose:
 *   dotProduct = v^T * w
 *   reflectionScale = factor * dotProduct, where factor = 2 / (v^T * v)
 *   w_new = w - reflectionScale * v
 * The subtracted vector is twice the projection onto v: this reverses that
 * component while preserving the perpendicular component and the total length.
 *
 * startRow stays fixed during this call; rowIndex - startRow indexes the shorter v.
 * Earlier rows remain unchanged. Compute the full dot product before overwriting w.
 */
function applyHouseholderReflection(values: number[], vector: number[], startRow: number, factor: number): void {
  let dotProduct = 0
  for (let rowIndex = startRow; rowIndex < values.length; rowIndex++) {
    dotProduct += vector[rowIndex - startRow] * values[rowIndex]
  }
  const reflectionScale = dotProduct * factor
  for (let rowIndex = startRow; rowIndex < values.length; rowIndex++) {
    values[rowIndex] -= reflectionScale * vector[rowIndex - startRow]
  }
}

/**
 * Selects the largest remaining column tail without changing column order.
 * diagonalIndex is both the first candidate column and the first active row.
 * Strict comparison keeps the first candidate on ties, preserving Excel's duplicate selection.
 */
function selectPivotColumn(columns: RegressionColumn[], diagonalIndex: number, activeColumnCount: number): number {
  let selectedColumnIndex = diagonalIndex
  let largestNorm = -1
  for (let columnIndex = diagonalIndex; columnIndex < activeColumnCount; columnIndex++) {
    const trailingNorm = norm(columns[columnIndex].values, diagonalIndex)
    if (trailingNorm > largestNorm) {
      largestNorm = trailingNorm
      selectedColumnIndex = columnIndex
    }
  }
  return selectedColumnIndex
}

/**
 * Solves R * solution = rightHandSide from the bottom row upward.
 * R[row, column] is stored as columns[column].values[row]. Subtract the already
 * solved terms to the right of the diagonal, then divide by the diagonal value.
 * Exactly zero diagonals leave a zero coefficient for Excel-compatible zero columns.
 */
function backSubstitute(columns: RegressionColumn[], processedColumnCount: number, rightHandSide: number[]): number[] {
  const solution = Array<number>(processedColumnCount).fill(0)
  for (let rowIndex = processedColumnCount - 1; rowIndex >= 0; rowIndex--) {
    if (columns[rowIndex].values[rowIndex] === 0) {
      continue
    }
    let remainingValue = rightHandSide[rowIndex]
    for (let columnIndex = rowIndex + 1; columnIndex < processedColumnCount; columnIndex++) {
      remainingValue -= columns[columnIndex].values[rowIndex] * solution[columnIndex]
    }
    solution[rowIndex] = remainingValue / columns[rowIndex].values[rowIndex]
  }
  return solution
}

/**
 * Computes standard errors from the retained triangular system, in original predictor order.
 *
 * For nonsingular R, covariance = residualVariance * inverseR * transpose(inverseR).
 * A coefficient's standard error is therefore sqrt(residualVariance) times the norm
 * of its row of inverseR. Solve R * inverseColumn = e_j for each unit vector e_j
 * to accumulate those row norms without building a full inverse or covariance matrix.
 *
 * With an intercept, centering changes it by -sum(coefficient * predictorMean), so each
 * inverse column contributes interceptWeight = inverseColumn[0] - sum(mean * inverseEntry).
 * Zero diagonals retain backSubstitute's Excel-compatible zero-coefficient behavior.
 */
function computeCoefficientStandardErrors(
  columns: RegressionColumn[],
  processedColumnCount: number,
  predictorMeans: number[],
  fitIntercept: boolean,
  residualVariance: number,
): CoefficientStandardErrors {
  const standardErrors = Array<number>(predictorMeans.length).fill(0)
  let interceptError = 0
  if (residualVariance === 0) {
    return {standardErrors, interceptError}
  }

  const interceptColumnCount = fitIntercept ? 1 : 0
  const residualStandardError = Math.sqrt(residualVariance)
  for (let inverseColumnIndex = 0; inverseColumnIndex < processedColumnCount; inverseColumnIndex++) {
    const rightHandSide = Array<number>(processedColumnCount).fill(0)
    rightHandSide[inverseColumnIndex] = 1
    const inverseColumn = backSubstitute(columns, processedColumnCount, rightHandSide)
    let interceptWeight = fitIntercept ? inverseColumn[0] : 0
    for (let columnIndex = interceptColumnCount; columnIndex < processedColumnCount; columnIndex++) {
      const predictorIndex = columns[columnIndex].predictorIndex
      // Scale before hypot: squaring inverse entries first can overflow or underflow.
      standardErrors[predictorIndex] = Math.hypot(standardErrors[predictorIndex], residualStandardError * inverseColumn[columnIndex])
      interceptWeight -= predictorMeans[predictorIndex] * inverseColumn[columnIndex]
    }
    interceptError = Math.hypot(interceptError, residualStandardError * interceptWeight)
  }
  return {standardErrors, interceptError}
}

/**
 * Fits observations using pivoted Householder QR, with a fixed leading intercept column.
 * Prepares columns, factorizes them, restores coefficients, then computes fit statistics.
 * Predictor centering preserves accuracy for large offsets. For n observations and k predictors,
 * the factorization uses O(n*k + k*k) storage and costs O(n*k*k) for n >= k; Q is never materialized.
 *
 * Exactly zero predictors intentionally consume an available QR slot. Excel Online returns a
 * zero coefficient but still excludes that transformed response entry from residual statistics.
 * A dependent nonzero predictor is instead removed using its relative norm, increasing degrees of freedom.
 *
 * @param predictors - observation rows, with predictor columns in their original order
 * @param observations - numeric response for each observation
 * @param fitIntercept - whether to include a constant term
 * @param statistics - whether to compute coefficient uncertainties
 */
export function fitLinearRegression(predictors: number[][], observations: number[], fitIntercept: boolean, statistics: boolean): LinearRegressionResult {
  const observationCount = observations.length
  const predictorCount = predictors[0].length
  const interceptColumnCount = fitIntercept ? 1 : 0
  const predictorMeans = Array<number>(predictorCount).fill(0)
  const columns: RegressionColumn[] = []
  if (fitIntercept) {
    columns.push({values: Array<number>(observationCount).fill(1), predictorIndex: -1, originalNorm: Math.sqrt(observationCount)})
  }
  for (let predictorIndex = 0; predictorIndex < predictorCount; predictorIndex++) {
    const values = predictors.map(row => row[predictorIndex])
    predictorMeans[predictorIndex] = fitIntercept ? mean(values) : 0
    const centeredValues = values.map(value => value - predictorMeans[predictorIndex])
    columns.push({values: centeredValues, predictorIndex, originalNorm: norm(centeredValues)})
  }

  // Excel tie ordering: [intercept, x1, x2, ...] -> [intercept, x2, ..., x1].
  // This matches swapping a trailing intercept into the first input position.
  if (fitIntercept && predictorCount > 1) {
    const firstPredictor = columns.splice(1, 1)[0]
    columns.push(firstPredictor)
  }
  // Remove a common response offset before reflection to preserve small variations.
  const responseOrigin = fitIntercept ? observations[0] : 0
  const transformedResponse = observations.map(value => value - responseOrigin)

  // Columns are partitioned as [processed | candidates | rejected]:
  // [0, processedColumnCount), [processedColumnCount, activeColumnCount), and the rest.
  // processedColumnCount is also the current diagonal index, not the mathematical rank:
  // exactly zero columns still consume a slot for Excel-compatible residual statistics.
  let activeColumnCount = columns.length
  let processedColumnCount = 0
  while (processedColumnCount < Math.min(observationCount, activeColumnCount)) {
    if (processedColumnCount >= interceptColumnCount) {
      const pivotColumnIndex = selectPivotColumn(columns, processedColumnCount, activeColumnCount)
      const previousColumn = columns[processedColumnCount]
      columns[processedColumnCount] = columns[pivotColumnIndex]
      columns[pivotColumnIndex] = previousColumn
    }
    const column = columns[processedColumnCount]
    const trailingNorm = norm(column.values, processedColumnCount)
    // Rejected predictors do not advance the diagonal. An originally zero column
    // gives 0 < 0 here, so it is retained and advances processedColumnCount below.
    if (processedColumnCount >= interceptColumnCount && trailingNorm < RANK_TOLERANCE * column.originalNorm) {
      activeColumnCount--
      columns[processedColumnCount] = columns[activeColumnCount]
      columns[activeColumnCount] = column
      continue
    }
    if (trailingNorm !== 0) {
      const {vector, factor, diagonalValue} = createHouseholderReflection(column.values, processedColumnCount, trailingNorm)
      for (let columnIndex = processedColumnCount + 1; columnIndex < activeColumnCount; columnIndex++) {
        applyHouseholderReflection(columns[columnIndex].values, vector, processedColumnCount, factor)
      }
      applyHouseholderReflection(transformedResponse, vector, processedColumnCount, factor)
      column.values[processedColumnCount] = diagonalValue
      column.values.fill(0, processedColumnCount + 1)
    }
    processedColumnCount++
  }

  // Solve in pivot order, then restore the caller's predictor order. Rejected slots stay zero.
  const solution = backSubstitute(columns, processedColumnCount, transformedResponse)
  const coefficients = Array<number>(predictorCount).fill(0)
  for (let columnIndex = interceptColumnCount; columnIndex < processedColumnCount; columnIndex++) {
    coefficients[columns[columnIndex].predictorIndex] = solution[columnIndex]
  }
  // Recover the intercept in original coordinates: b = mean(y) - sum(coefficient * mean(x)).
  const intercept = fitIntercept
    ? mean(observations) - coefficients.reduce((sum, coefficient, predictorIndex) => sum + coefficient * predictorMeans[predictorIndex], 0)
    : 0

  const responseMean = fitIntercept ? mean(observations) : 0
  const centeredResponse = observations.map(value => value - responseMean)
  const totalSumSquares = norm(centeredResponse) ** 2
  // Reflections preserve squared error; entries below the solved rows are the residual tail.
  let residualSumSquares = norm(transformedResponse, processedColumnCount) ** 2
  // Simple exact fits have zero residual statistics in Excel. Discard only
  // reflection roundoff, whose squared scale is O((n * machine epsilon)^2).
  const simpleFitRoundoff = predictorCount === 1 && residualSumSquares <= totalSumSquares * (observationCount * Number.EPSILON) ** 2
  if (totalSumSquares === 0 || processedColumnCount === observationCount || simpleFitRoundoff) {
    residualSumSquares = 0
  }
  const degreesOfFreedom = observationCount - processedColumnCount
  const residualVariance = degreesOfFreedom === 0 ? 0 : residualSumSquares / degreesOfFreedom
  const {standardErrors, interceptError} = statistics
    ? computeCoefficientStandardErrors(columns, processedColumnCount, predictorMeans, fitIntercept, residualVariance)
    : {standardErrors: Array<number>(predictorCount).fill(0), interceptError: 0}
  return {
    coefficients,
    intercept,
    standardErrors,
    interceptError,
    residualSumSquares,
    totalSumSquares,
    degreesOfFreedom,
    retainedPredictorCount: processedColumnCount - interceptColumnCount,
  }
}
