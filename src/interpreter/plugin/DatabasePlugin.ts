/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, getRawValue, InternalScalarValue, InterpreterValue, isExtendedNumber, RawScalarValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'
import {CriterionLambda} from '../Criterion'

/**
 * Parsed criterion for a single cell in the criteria range.
 * Maps a database column index to a matching lambda.
 */
interface DatabaseCriterionEntry {
  /** 0-based column index within the database range. */
  columnIndex: number,
  /** Lambda that tests whether a raw cell value satisfies the criterion. */
  lambda: CriterionLambda,
}

/**
 * A single criteria row is a list of AND-ed criterion entries.
 * Multiple criteria rows are OR-ed together.
 */
type DatabaseCriteriaRow = DatabaseCriterionEntry[]

/** Shared parameter signature for all database functions: (database RANGE, field SCALAR, criteria RANGE). */
const databaseFunctionParameters = [
  {argumentType: FunctionArgumentType.RANGE},
  {argumentType: FunctionArgumentType.SCALAR},
  {argumentType: FunctionArgumentType.RANGE},
]

/**
 * Interpreter plugin implementing Excel database functions.
 *
 * Implements: DAVERAGE, DCOUNT, DCOUNTA, DGET, DMAX, DMIN, DPRODUCT, DSTDEV, DSTDEVP, DSUM, DVAR, DVARP.
 */
export class DatabasePlugin extends FunctionPlugin implements FunctionPluginTypecheck<DatabasePlugin> {

  public static implementedFunctions: ImplementedFunctions = {
    'DCOUNT': {method: 'dcount', parameters: databaseFunctionParameters},
    'DCOUNTA': {method: 'dcounta', parameters: databaseFunctionParameters},
    'DPRODUCT': {method: 'dproduct', parameters: databaseFunctionParameters},
    'DSTDEV': {method: 'dstdev', parameters: databaseFunctionParameters},
    'DSTDEVP': {method: 'dstdevp', parameters: databaseFunctionParameters},
    'DSUM': {method: 'dsum', parameters: databaseFunctionParameters},
    'DVAR': {method: 'dvar', parameters: databaseFunctionParameters},
    'DVARP': {method: 'dvarp', parameters: databaseFunctionParameters},
    'DAVERAGE': {method: 'daverage', parameters: databaseFunctionParameters},
    'DGET': {method: 'dget', parameters: databaseFunctionParameters},
    'DMAX': {method: 'dmax', parameters: databaseFunctionParameters},
    'DMIN': {method: 'dmin', parameters: databaseFunctionParameters},
  }

  /**
   * Resolves field index and criteria, then delegates to the callback with the parsed database arguments.
   * Shared boilerplate for all 12 database functions.
   */
  private withDatabaseArgs(
    ast: ProcedureAst,
    state: InterpreterState,
    functionName: string,
    callback: (dbData: InternalScalarValue[][], fieldIndex: number, criteriaRows: DatabaseCriteriaRow[]) => InternalScalarValue
  ): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata(functionName),
      (database: SimpleRangeValue, field: RawScalarValue, criteria: SimpleRangeValue) => {
        const fieldIndex = this.resolveFieldIndex(database, field)
        if (fieldIndex instanceof CellError) {
          return fieldIndex
        }

        const criteriaRows = this.buildDatabaseCriteria(database, criteria)
        if (criteriaRows instanceof CellError) {
          return criteriaRows
        }

        return callback(database.data, fieldIndex, criteriaRows)
      })
  }

  /**
   * Counts cells containing numbers in the specified field of a database range,
   * for rows that match all criteria.
   *
   * DCOUNT(database, field, criteria)
   */
  public dcount(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DCOUNT', (dbData, fieldIndex, criteriaRows) => {
      let count = 0

      for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
        if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
          if (isExtendedNumber(dbData[rowIdx][fieldIndex])) {
            count++
          }
        }
      }

      return count
    })
  }

  /**
   * Counts all non-blank cells in the specified field of a database range,
   * for rows that match all criteria.
   *
   * DCOUNTA(database, field, criteria)
   */
  public dcounta(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DCOUNTA', (dbData, fieldIndex, criteriaRows) => {
      let count = 0

      for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
        if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
          const cellValue = dbData[rowIdx][fieldIndex]
          if (cellValue !== EmptyValue && cellValue !== undefined && cellValue !== null) {
            count++
          }
        }
      }

      return count
    })
  }

  /**
   * Returns the product of numeric values in the specified field of a database range,
   * for rows that match all criteria.
   *
   * DPRODUCT(database, field, criteria)
   */
  public dproduct(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DPRODUCT', (dbData, fieldIndex, criteriaRows) => {
      let product = 1
      let hasNumeric = false

      for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
        if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
          const cellValue = dbData[rowIdx][fieldIndex]
          if (isExtendedNumber(cellValue)) {
            product *= getRawValue(cellValue)
            hasNumeric = true
          }
        }
      }

      return hasNumeric ? product : 0
    })
  }

  /**
   * Returns the sum of numeric values in the specified field of a database range,
   * for rows that match all criteria.
   *
   * DSUM(database, field, criteria)
   */
  public dsum(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DSUM', (dbData, fieldIndex, criteriaRows) => {
      let sum = 0

      for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
        if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
          const cellValue = dbData[rowIdx][fieldIndex]
          if (isExtendedNumber(cellValue)) {
            sum += getRawValue(cellValue)
          }
        }
      }

      return sum
    })
  }

  /**
   * Returns the average of numeric values in the specified field of a database range,
   * for rows that match all criteria.
   * Returns #DIV/0! when no numeric values are found.
   *
   * DAVERAGE(database, field, criteria)
   */
  public daverage(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DAVERAGE', (dbData, fieldIndex, criteriaRows) => {
      let sum = 0
      let count = 0

      for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
        if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
          const cellValue = dbData[rowIdx][fieldIndex]
          if (isExtendedNumber(cellValue)) {
            sum += getRawValue(cellValue)
            count++
          }
        }
      }

      if (count === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      }

      return sum / count
    })
  }

  /**
   * Returns a single value from the specified field of a database range,
   * for the row that matches all criteria.
   * Returns #VALUE! if no rows match, #NUM! if more than one row matches.
   *
   * DGET(database, field, criteria)
   */
  public dget(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DGET', (dbData, fieldIndex, criteriaRows) => {
      let matchedValue: InternalScalarValue | undefined
      let matchCount = 0

      for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
        if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
          matchCount++
          if (matchCount > 1) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
          }
          matchedValue = dbData[rowIdx][fieldIndex]
        }
      }

      if (matchCount === 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }

      return matchedValue === EmptyValue || matchedValue === undefined || matchedValue === null
        ? 0
        : matchedValue
    })
  }

  /**
   * Returns the maximum numeric value in the specified field of a database range,
   * for rows that match all criteria.
   * Returns 0 when no numeric values are found (Excel behavior).
   *
   * DMAX(database, field, criteria)
   */
  public dmax(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DMAX', (dbData, fieldIndex, criteriaRows) => {
      let max = -Infinity
      let hasNumeric = false

      for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
        if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
          const cellValue = dbData[rowIdx][fieldIndex]
          if (isExtendedNumber(cellValue)) {
            const numValue = getRawValue(cellValue)
            if (numValue > max) {
              max = numValue
            }
            hasNumeric = true
          }
        }
      }

      return hasNumeric ? max : 0
    })
  }

  /**
   * Returns the minimum numeric value in the specified field of a database range,
   * for rows that match all criteria.
   * Returns 0 when no numeric values are found (Excel behavior).
   *
   * DMIN(database, field, criteria)
   */
  public dmin(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DMIN', (dbData, fieldIndex, criteriaRows) => {
      let min = Infinity
      let hasNumeric = false

      for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
        if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
          const cellValue = dbData[rowIdx][fieldIndex]
          if (isExtendedNumber(cellValue)) {
            const numValue = getRawValue(cellValue)
            if (numValue < min) {
              min = numValue
            }
            hasNumeric = true
          }
        }
      }

      return hasNumeric ? min : 0
    })
  }

  /**
   * Returns the sample standard deviation of numeric values in the specified field
   * of a database range, for rows that match all criteria.
   * Returns #DIV/0! when fewer than 2 numeric values are found.
   *
   * DSTDEV(database, field, criteria)
   */
  public dstdev(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DSTDEV', (dbData, fieldIndex, criteriaRows) => {
      const values = this.collectNumericValues(dbData, fieldIndex, criteriaRows)

      if (values.length <= 1) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
      return Math.sqrt(variance)
    })
  }

  /**
   * Returns the population standard deviation of numeric values in the specified field
   * of a database range, for rows that match all criteria.
   * Returns #DIV/0! when no numeric values are found.
   * Returns 0 when exactly one numeric value is found.
   *
   * DSTDEVP(database, field, criteria)
   */
  public dstdevp(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DSTDEVP', (dbData, fieldIndex, criteriaRows) => {
      const values = this.collectNumericValues(dbData, fieldIndex, criteriaRows)

      if (values.length === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
      return Math.sqrt(variance)
    })
  }

  /**
   * Returns the sample variance of numeric values in the specified field
   * of a database range, for rows that match all criteria.
   * Returns #DIV/0! when fewer than 2 numeric values are found.
   *
   * DVAR(database, field, criteria)
   */
  public dvar(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DVAR', (dbData, fieldIndex, criteriaRows) => {
      const values = this.collectNumericValues(dbData, fieldIndex, criteriaRows)

      if (values.length <= 1) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length
      return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
    })
  }

  /**
   * Returns the population variance of numeric values in the specified field
   * of a database range, for rows that match all criteria.
   * Returns #DIV/0! when no numeric values are found.
   * Returns 0 when exactly one numeric value is found.
   *
   * DVARP(database, field, criteria)
   */
  public dvarp(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.withDatabaseArgs(ast, state, 'DVARP', (dbData, fieldIndex, criteriaRows) => {
      const values = this.collectNumericValues(dbData, fieldIndex, criteriaRows)

      if (values.length === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length
      return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    })
  }

  /**
   * Collects numeric values from the specified field column of matching database rows.
   *
   * @param dbData - Full database data including header row.
   * @param fieldIndex - 0-based column index of the target field.
   * @param criteriaRows - Parsed criteria rows.
   * @returns Array of numeric values from matching rows.
   */
  private collectNumericValues(
    dbData: InternalScalarValue[][],
    fieldIndex: number,
    criteriaRows: DatabaseCriteriaRow[]
  ): number[] {
    const values: number[] = []

    for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
      if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
        const cellValue = dbData[rowIdx][fieldIndex]
        if (isExtendedNumber(cellValue)) {
          values.push(getRawValue(cellValue))
        }
      }
    }

    return values
  }

  /**
   * Resolves the field argument to a 0-based column index within the database range.
   *
   * @param database - The database range (first row = headers).
   * @param field - A string (header name, case-insensitive) or number (1-based column index).
   *   Booleans are coerced to numbers (TRUE → 1, FALSE → 0) per Excel convention.
   * @returns 0-based column index, or CellError if field is invalid.
   */
  private resolveFieldIndex(database: SimpleRangeValue, field: RawScalarValue): number | CellError {
    const headers = database.data[0]

    if (typeof field === 'string') {
      const lowerField = field.toLowerCase()
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i]
        if (typeof header === 'string' && header.toLowerCase() === lowerField) {
          return i
        }
      }
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }

    const numericField = typeof field === 'boolean' ? Number(field) : field

    if (isExtendedNumber(numericField)) {
      const index = Math.trunc(getRawValue(numericField))
      if (index < 1 || index > headers.length) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
      return index - 1
    }

    return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
  }

  /**
   * Parses the criteria range into an array of criteria rows.
   * Each row is a list of AND-ed conditions. Rows are OR-ed together.
   *
   * @param database - The database range (first row = headers).
   * @param criteria - The criteria range (first row = header labels, subsequent rows = conditions).
   * @returns Array of criteria rows, or CellError if a criterion cannot be parsed.
   */
  private buildDatabaseCriteria(database: SimpleRangeValue, criteria: SimpleRangeValue): DatabaseCriteriaRow[] | CellError {
    const dbHeaders = database.data[0]
    const criteriaData = criteria.data
    const criteriaHeaders = criteriaData[0]

    // Map each criteria column to a database column index (or -1 if no match)
    const criteriaColumnMapping: number[] = criteriaHeaders.map(criteriaHeader => {
      if (typeof criteriaHeader !== 'string') {
        return -1
      }
      const lowerHeader = criteriaHeader.toLowerCase()
      return dbHeaders.findIndex(
        dbHeader => typeof dbHeader === 'string' && dbHeader.toLowerCase() === lowerHeader
      )
    })

    const rows: DatabaseCriteriaRow[] = []

    for (let rowIdx = 1; rowIdx < criteriaData.length; rowIdx++) {
      const row: DatabaseCriteriaRow = []

      for (let colIdx = 0; colIdx < criteriaHeaders.length; colIdx++) {
        const dbColIndex = criteriaColumnMapping[colIdx]
        if (dbColIndex === -1) {
          continue // Unknown criteria header — ignore
        }

        const criterionValue = criteriaData[rowIdx]?.[colIdx]

        // Empty/blank criteria cell = match-all for that column — skip
        if (criterionValue === EmptyValue || criterionValue === undefined || criterionValue === null) {
          continue
        }

        const rawCriterionValue = isExtendedNumber(criterionValue) ? getRawValue(criterionValue) : criterionValue

        const criterionPackage = this.interpreter.criterionBuilder.fromCellValue(
          rawCriterionValue as RawScalarValue,
          this.arithmeticHelper
        )

        if (criterionPackage === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadCriterion)
        }

        row.push({
          columnIndex: dbColIndex,
          lambda: criterionPackage.lambda,
        })
      }

      rows.push(row)
    }

    return rows
  }

  /**
   * Tests whether a database data row matches any of the criteria rows (OR logic).
   * Within each criteria row, all conditions must match (AND logic).
   *
   * @param dataRow - A single row of data from the database (excluding the header row).
   * @param criteriaRows - Parsed criteria rows.
   * @returns true if the row qualifies, false otherwise.
   */
  private rowMatchesCriteria(dataRow: InternalScalarValue[], criteriaRows: DatabaseCriteriaRow[]): boolean {
    if (criteriaRows.length === 0) {
      return false
    }

    return criteriaRows.some(criteriaRow => {
      if (criteriaRow.length === 0) {
        return true // Empty criteria row = match all
      }

      return criteriaRow.every(entry => {
        const cellValue = dataRow[entry.columnIndex]
        const rawValue = isExtendedNumber(cellValue) ? getRawValue(cellValue) : cellValue
        return entry.lambda(rawValue)
      })
    })
  }
}
