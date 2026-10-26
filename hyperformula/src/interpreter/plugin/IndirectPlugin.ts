/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange, SimpleCellRange, simpleCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {FormulaVertex} from '../../DependencyGraph/FormulaVertex'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {AstNodeType, ProcedureAst} from '../../parser'
import {
  simpleCellAddressFromString,
  simpleCellRangeFromString,
  simpleColumnRangeFromString,
  simpleRowRangeFromString,
} from '../../parser/addressRepresentationConverters'
import {RANGE_OPERATOR} from '../../parser/parser-consts'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {EVALUATION_DEFERRED} from '../EvaluationDeferred'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

const R1C1_CELL = /^R(\[-?\d+\]|\d+)?C(\[-?\d+\]|\d+)?$/i
const R1C1_ROW = /^R(\[-?\d+\]|\d+)?$/i
const R1C1_COLUMN = /^C(\[-?\d+\]|\d+)?$/i

/**
 * Converts the number after R or C to a 0-based index: an absolute 1-based number, a relative [offset] from the base,
 * or nothing (offset 0).
 */
function r1c1Coordinate(part: string | undefined, base: number): number {
  if (part === undefined) {
    return base
  }
  if (part.startsWith('[')) {
    return base + Number(part.slice(1, -1))
  }
  return Number(part) - 1
}

/**
 * Parses one R1C1 cell: R and C, each followed by a coordinate (see {@link r1c1Coordinate}).
 */
function r1c1CellAddress(text: string, sheet: number, formulaAddress: SimpleCellAddress): Maybe<SimpleCellAddress> {
  const match = R1C1_CELL.exec(text)
  if (match === null) {
    return undefined
  }
  return simpleCellAddress(sheet, r1c1Coordinate(match[2], formulaAddress.col), r1c1Coordinate(match[1], formulaAddress.row))
}

/**
 * Parses one R1C1 whole row (R2) or whole column (C2), matched by the given pattern, to a 0-based index.
 */
function r1c1Index(pattern: RegExp, text: string, base: number): Maybe<number> {
  const match = pattern.exec(text)
  return match === null ? undefined : r1c1Coordinate(match[1], base)
}

/**
 * Returns the range with its corners in order, like Excel: "B2:A1" is A1:B2, "C:B" is B:C. Whole columns and rows stay
 * whole columns and rows; any other range stays a range of cells, so a coordinate that overflowed to Infinity (a row
 * number of 309 digits) exceeds the sheet limits instead of passing for a whole column or row.
 */
function sortedRange(range: SimpleCellRange): AbsoluteCellRange {
  const {start, end} = range
  if (range instanceof AbsoluteColumnRange) {
    return new AbsoluteColumnRange(start.sheet, Math.min(start.col, end.col), Math.max(start.col, end.col))
  }
  if (range instanceof AbsoluteRowRange) {
    return new AbsoluteRowRange(start.sheet, Math.min(start.row, end.row), Math.max(start.row, end.row))
  }
  return new AbsoluteCellRange(
    simpleCellAddress(start.sheet, Math.min(start.col, end.col), Math.min(start.row, end.row)),
    simpleCellAddress(start.sheet, Math.max(start.col, end.col), Math.max(start.row, end.row)),
  )
}

/**
 * Removes trailing spaces and line feeds, as Excel ignores them; any other whitespace makes the text invalid. A loop,
 * not a regex: /[ \n]+$/ takes quadratic time on a long run of spaces followed by another character.
 */
function trimTrailingSpacesAndLineFeeds(text: string): string {
  let end = text.length
  while (end > 0 && (text[end - 1] === ' ' || text[end - 1] === '\n')) {
    end--
  }
  return text.slice(0, end)
}

/**
 * Removes the quotes around a sheet name like 'My Sheet', where '' stands for one quote.
 */
function unquoteSheetName(name: string): string {
  if (name.length >= 2 && name.startsWith("'") && name.endsWith("'")) {
    return name.slice(1, -1).replace(/''/g, "'")
  }
  return name
}

export class IndirectPlugin extends FunctionPlugin implements FunctionPluginTypecheck<IndirectPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'INDIRECT': {
      method: 'indirect',
      parameters: [
        {argumentType: FunctionArgumentType.STRING},
        {argumentType: FunctionArgumentType.BOOLEAN, optionalArg: true, defaultValue: true, emptyAsDefault: true},
      ],
      // Not volatile: a formula is recomputed through the edges to its selector and to the cell it read. Edits that
      // change what an address points to without changing a cell (structure, sheets) mark it dirty instead.
      isDependentOnSheetStructureChange: true,
      vectorizationForbidden: true,
    },
  }

  /**
   * Corresponds to INDIRECT(ref_text, [a1])
   *
   * Returns the value of the cell, or the range, whose address is given as text. Supports A1 addresses of single
   * cells, of ranges and of whole columns and rows, optionally with a sheet name, and names of named expressions that
   * refer to a cell or range. With a1 = FALSE, the text is an R1C1 reference to a cell, a range, or whole columns or
   * rows, or a name. Trailing spaces and line feeds in the text are ignored.
   *
   * @param ast
   * @param state
   */
  public indirect(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('INDIRECT'), (text: string, a1: boolean): InterpreterValue => {
      const refText = trimTrailingSpacesAndLineFeeds(text)
      const resolveSheet = (sheetName: string) => this.dependencyGraph.sheetMapping.getSheetId(sheetName)

      if (!a1) {
        const range = this.r1c1Reference(refText, state.formulaAddress) ?? this.namedReference(refText, state.formulaAddress.sheet)
        return this.readReference(range, state)
      }

      const address = simpleCellAddressFromString(resolveSheet, refText, state.formulaAddress.sheet)

      if (address !== undefined) {
        return this.readReference(simpleCellRange(address, address), state)
      }

      const range = simpleCellRangeFromString(resolveSheet, refText, state.formulaAddress.sheet)
        ?? simpleColumnRangeFromString(resolveSheet, refText, state.formulaAddress.sheet)
        ?? simpleRowRangeFromString(resolveSheet, refText, state.formulaAddress.sheet)
        ?? this.namedReference(refText, state.formulaAddress.sheet)
      return this.readReference(range, state)
    })
  }

  /**
   * Reads a reference given by its two corners: a cell if they are the same, otherwise a range. Whole columns and
   * rows have an infinite end row or column, as in {@link AbsoluteColumnRange} and {@link AbsoluteRowRange}.
   * Returns #REF! if there is no reference or it leaves the existing sheets or the sheet limits.
   *
   * If the caller uses only the position or the size of the reference (see {@link InterpreterState.referenceExpected}),
   * returns it as a range, even for one cell, without reading its cells or recording them as dependencies: the
   * caller does not depend on their values, so a cell that refers back to the formula is no cycle.
   */
  private readReference(range: Maybe<SimpleCellRange>, state: InterpreterState): InterpreterValue {
    if (range === undefined || !this.dependencyGraph.sheetMapping.hasSheetWithId(range.start.sheet)) {
      return new CellError(ErrorType.REF, ErrorMessage.BadRef)
    }
    const normalized = sortedRange(range)
    if (normalized.start.col < 0 || normalized.start.row < 0 || normalized.exceedsSheetSizeLimits(this.config.maxColumns, this.config.maxRows)) {
      return new CellError(ErrorType.REF, ErrorMessage.BadRef)
    }
    if (state.referenceExpected) {
      return SimpleRangeValue.onlyRange(normalized, this.dependencyGraph)
    }
    if (range.start.row === range.end.row && range.start.col === range.end.col) {
      return this.readCell(range.start, state)
    }
    return this.readRange(normalized, state)
  }

  /**
   * Parses an R1C1 reference to a cell, a range of cells, or whole rows or columns, optionally with a sheet name:
   * R2C3, R[-1]C[2] (relative to the formula's cell), RC (the formula's own cell), R1C1:R2C2, R2, C[-1]:C2.
   * Returns undefined if the text is not such a reference or names an unknown sheet.
   */
  private r1c1Reference(text: string, formulaAddress: SimpleCellAddress): Maybe<SimpleCellRange> {
    const sheetSeparator = text.lastIndexOf('!')
    let sheet = formulaAddress.sheet
    let reference = text
    if (sheetSeparator >= 0) {
      const sheetId = this.dependencyGraph.sheetMapping.getSheetId(unquoteSheetName(text.slice(0, sheetSeparator)))
      if (sheetId === undefined) {
        return undefined
      }
      sheet = sheetId
      reference = text.slice(sheetSeparator + 1)
    }
    const corners = reference.split(RANGE_OPERATOR)
    if (corners.length > 2) {
      return undefined
    }
    const [first, last = first] = corners

    const start = r1c1CellAddress(first, sheet, formulaAddress)
    const end = r1c1CellAddress(last, sheet, formulaAddress)
    if (start !== undefined && end !== undefined) {
      return simpleCellRange(start, end)
    }
    const startRow = r1c1Index(R1C1_ROW, first, formulaAddress.row)
    const endRow = r1c1Index(R1C1_ROW, last, formulaAddress.row)
    if (startRow !== undefined && endRow !== undefined) {
      return new AbsoluteRowRange(sheet, startRow, endRow)
    }
    const startColumn = r1c1Index(R1C1_COLUMN, first, formulaAddress.col)
    const endColumn = r1c1Index(R1C1_COLUMN, last, formulaAddress.col)
    if (startColumn !== undefined && endColumn !== undefined) {
      return new AbsoluteColumnRange(sheet, startColumn, endColumn)
    }
    return undefined
  }

  /**
   * Returns the cell, range, or whole columns or rows a named expression refers to, as a range (a single cell is a
   * one-cell range), or undefined if there is no such name in scope or it is not a reference (e.g., =5).
   */
  private namedReference(name: string, sheet: number): Maybe<AbsoluteCellRange> {
    const namedExpression = this.dependencyGraph.namedExpressions.nearestNamedExpression(name, sheet)
    if (namedExpression === undefined) {
      return undefined
    }
    const vertex = this.dependencyGraph.addressMapping.getCell(namedExpression.address)
    if (!(vertex instanceof FormulaVertex)) {
      return undefined
    }
    const ast = vertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
    const baseAddress = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
    if (ast.type === AstNodeType.CELL_REFERENCE) {
      const address = ast.reference.toSimpleCellAddress(baseAddress)
      return new AbsoluteCellRange(address, address)
    }
    if (ast.type === AstNodeType.CELL_RANGE || ast.type === AstNodeType.COLUMN_RANGE || ast.type === AstNodeType.ROW_RANGE) {
      return AbsoluteCellRange.fromAstOrUndef(ast, baseAddress)
    }
    return undefined
  }

  /**
   * Returns the range as a reference. Its cells are read lazily, when their values or its `range` are first used (SUM,
   * lookups, criteria, an operator, the whole formula), and the range is recorded as a runtime dependency of the
   * evaluated formula only then. Pending cells are requested and the evaluation is deferred. Its size and
   * `rangeWithoutReading`, which ROW, COLUMN, ROWS and COLUMNS use, record nothing.
   */
  private readRange(range: AbsoluteCellRange, state: InterpreterState): SimpleRangeValue {
    const pass = this.interpreter.evaluationPass
    const dependent = state.formulaVertex
    return SimpleRangeValue.onlyRangeWithReadHook(range, this.dependencyGraph, () => {
      if (pass === undefined || dependent === undefined || pass.dependent !== dependent) {
        return
      }
      const pending = pass.pendingVerticesOfRange(pass.recordRangeDependency(range))
      if (pending.length > 0) {
        pending.forEach(vertex => pass.requestPull(vertex))
        throw EVALUATION_DEFERRED
      }
    })
  }

  /**
   * Reads the value of a cell, recording it as a runtime dependency of the evaluated formula.
   * If the cell is a formula that is not current yet in the running pass, requests it and defers the evaluation:
   * the formula is retried once the cell is computed.
   */
  private readCell(address: SimpleCellAddress, state: InterpreterState): InterpreterValue {
    const pass = this.interpreter.evaluationPass

    if (pass === undefined || state.formulaVertex === undefined || pass.dependent !== state.formulaVertex) {
      return this.dependencyGraph.getCellValue(address)
    }

    if (this.dependencyGraph.addressMapping.getCell(address) === state.formulaVertex) {
      return new CellError(ErrorType.CYCLE, undefined, state.formulaVertex)
    }

    const vertex = pass.recordDependency(address)

    if (vertex instanceof FormulaVertex) {
      if (pass.isPending(vertex)) {
        pass.requestPull(vertex)
        throw EVALUATION_DEFERRED
      }
      if (!vertex.isComputed()) {
        return new CellError(ErrorType.REF, ErrorMessage.BadRef)
      }
    }

    return this.dependencyGraph.getCellValue(address)
  }
}
