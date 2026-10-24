/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, SimpleCellRange, simpleCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {Vertex} from '../../DependencyGraph'
import {FormulaVertex} from '../../DependencyGraph/FormulaVertex'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {AstNodeType, ProcedureAst} from '../../parser'
import {simpleCellAddressFromString, simpleCellRangeFromString} from '../../parser/addressRepresentationConverters'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {EVALUATION_DEFERRED} from '../EvaluationDeferred'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

const R1C1_CELL = /^R(\[-?\d+\]|\d+)?C(\[-?\d+\]|\d+)?$/i

/**
 * Parses one R1C1 cell: R and C followed by an absolute 1-based number, a relative [offset], or nothing (offset 0).
 */
function r1c1CellAddress(text: string, sheet: number, formulaAddress: SimpleCellAddress): Maybe<SimpleCellAddress> {
  const match = R1C1_CELL.exec(text)
  if (match === null) {
    return undefined
  }
  const coordinate = (part: string | undefined, base: number): number => {
    if (part === undefined) {
      return base
    }
    if (part.startsWith('[')) {
      return base + Number(part.slice(1, -1))
    }
    return Number(part) - 1
  }
  return simpleCellAddress(sheet, coordinate(match[2], formulaAddress.col), coordinate(match[1], formulaAddress.row))
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
   * cells and of ranges, optionally with a sheet name, and names of named expressions that refer to a cell or range.
   * With a1 = FALSE, the text is an R1C1 reference to a cell or range, or a name.
   *
   * @param ast
   * @param state
   */
  public indirect(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('INDIRECT'), (refText: string, a1: boolean): InterpreterValue => {
      const resolveSheet = (sheetName: string) => this.dependencyGraph.sheetMapping.getSheetId(sheetName)

      if (!a1) {
        const range = this.r1c1Reference(refText, state.formulaAddress) ?? this.namedReference(refText, state.formulaAddress.sheet)
        return this.readReference(range, state)
      }

      const address = simpleCellAddressFromString(resolveSheet, refText, state.formulaAddress.sheet)

      if (address !== undefined) {
        if (!this.isExistingAddress(address)) {
          return new CellError(ErrorType.REF, ErrorMessage.BadRef)
        }
        return this.readCell(address, state)
      }

      const range = simpleCellRangeFromString(resolveSheet, refText, state.formulaAddress.sheet)
        ?? this.namedReference(refText, state.formulaAddress.sheet)
      return this.readReference(range, state)
    })
  }

  /**
   * Reads a reference given by its two corners: a cell if they are the same, otherwise a range.
   * Returns #REF! if there is no reference or it leaves the existing sheets or the sheet limits.
   */
  private readReference(range: Maybe<SimpleCellRange>, state: InterpreterState): InterpreterValue {
    if (range === undefined || !this.isExistingAddress(range.start) || !this.isExistingAddress(range.end)) {
      return new CellError(ErrorType.REF, ErrorMessage.BadRef)
    }
    if (range.start.row === range.end.row && range.start.col === range.end.col) {
      return this.readCell(range.start, state)
    }
    // corners in any order, like Excel: "B2:A1" is A1:B2
    const normalized = AbsoluteCellRange.fromCoordinates(range.start.sheet,
      Math.min(range.start.col, range.end.col), Math.min(range.start.row, range.end.row),
      Math.max(range.start.col, range.end.col), Math.max(range.start.row, range.end.row))
    return this.readRange(normalized, state)
  }

  /**
   * Parses an R1C1 reference to a cell or a range of cells, optionally with a sheet name: R2C3, R[-1]C[2]
   * (relative to the formula's cell), RC (the formula's own cell), R1C1:R2C2. Whole rows and columns are not
   * supported. Returns undefined if the text is not such a reference or names an unknown sheet.
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
    const corners = reference.split(':')
    if (corners.length > 2) {
      return undefined
    }
    const start = r1c1CellAddress(corners[0], sheet, formulaAddress)
    const end = corners.length === 2 ? r1c1CellAddress(corners[1], sheet, formulaAddress) : start
    if (start === undefined || end === undefined) {
      return undefined
    }
    return simpleCellRange(start, end)
  }

  /**
   * Returns the cell or range a named expression refers to, as a range (a single cell is a one-cell range),
   * or undefined if there is no such name in scope or it is not a reference (e.g., =5).
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
    if (ast.type === AstNodeType.CELL_RANGE) {
      return AbsoluteCellRange.fromAstOrUndef(ast, baseAddress)
    }
    return undefined
  }

  /**
   * Returns true if the address is on an existing sheet and within the limits set by the maxRows and maxColumns options.
   */
  private isExistingAddress(address: SimpleCellAddress): boolean {
    return this.dependencyGraph.sheetMapping.hasSheetWithId(address.sheet) && this.isWithinSheetLimits(address)
  }

  /**
   * Returns the range as a reference. Its cells are read lazily: only when a function uses the values (SUM) or the
   * address (lookups, criteria), not when it only needs the size (ROWS), so the range is recorded as a runtime
   * dependency of the evaluated formula only then. Pending cells are requested and the evaluation is deferred.
   */
  private readRange(range: AbsoluteCellRange, state: InterpreterState): SimpleRangeValue {
    const pass = this.interpreter.evaluationPass
    const dependent = state.formulaVertex
    return SimpleRangeValue.onlyRangeWithReadHook(range, this.dependencyGraph, () => {
      if (pass === undefined || dependent === undefined || pass.dependent !== dependent) {
        return
      }
      const rangeVertex = pass.recordRangeDependency(range)
      const pending: Vertex[] = []
      if (pass.isPending(rangeVertex)) {
        pending.push(rangeVertex)
      } else {
        for (const address of range.addresses(this.dependencyGraph)) {
          const cell = this.dependencyGraph.addressMapping.getCell(address)
          if (cell !== undefined && pass.isPending(cell)) {
            pending.push(cell)
          }
        }
      }
      if (pending.length > 0) {
        pending.forEach(vertex => pass.requestPull(vertex))
        throw EVALUATION_DEFERRED
      }
    })
  }

  /**
   * Returns true if the address is within the limits set by the maxRows and maxColumns options.
   */
  private isWithinSheetLimits(address: SimpleCellAddress): boolean {
    return address.row >= 0 && address.col >= 0 && address.row < this.config.maxRows && address.col < this.config.maxColumns
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
