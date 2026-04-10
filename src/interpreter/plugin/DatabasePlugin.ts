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

/**
 * Interpreter plugin implementing Excel database functions.
 *
 * Currently implements: DCOUNT.
 * Designed to be extended with DSUM, DAVERAGE, DMAX, DMIN, etc.
 */
export class DatabasePlugin extends FunctionPlugin implements FunctionPluginTypecheck<DatabasePlugin> {

  public static implementedFunctions: ImplementedFunctions = {
    'DCOUNT': {
      method: 'dcount',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.RANGE},
      ],
    },
  }

  /**
   * Counts cells containing numbers in the specified field of a database range,
   * for rows that match all criteria.
   *
   * DCOUNT(database, field, criteria)
   */
  public dcount(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DCOUNT'),
      (database: SimpleRangeValue, field: RawScalarValue, criteria: SimpleRangeValue) => {
        const fieldIndex = this.resolveFieldIndex(database, field)
        if (fieldIndex instanceof CellError) {
          return fieldIndex
        }

        const criteriaRows = this.buildDatabaseCriteria(database, criteria)
        if (criteriaRows instanceof CellError) {
          return criteriaRows
        }

        const dbData = database.data
        let count = 0

        for (let rowIdx = 1; rowIdx < dbData.length; rowIdx++) {
          if (this.rowMatchesCriteria(dbData[rowIdx], criteriaRows)) {
            const cellValue = dbData[rowIdx][fieldIndex]
            if (isExtendedNumber(cellValue)) {
              count++
            }
          }
        }

        return count
      })
  }

  /**
   * Resolves the field argument to a 0-based column index within the database range.
   *
   * @param database - The database range (first row = headers).
   * @param field - A string (header name, case-insensitive) or number (1-based column index).
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

    if (isExtendedNumber(field)) {
      const index = Math.trunc(getRawValue(field))
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
