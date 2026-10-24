/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {FormulaVertex} from '../../DependencyGraph/FormulaVertex'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {simpleCellAddressFromString} from '../../parser/addressRepresentationConverters'
import {EVALUATION_DEFERRED} from '../EvaluationDeferred'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

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
   * Returns the value of the cell whose address is given as text. Supports single-cell A1 addresses,
   * optionally with a sheet name.
   *
   * @param ast
   * @param state
   */
  public indirect(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('INDIRECT'), (refText: string, a1: boolean): InterpreterValue => {
      if (!a1) {
        return new CellError(ErrorType.REF, ErrorMessage.R1C1NotSupported)
      }

      const address = simpleCellAddressFromString(
        (sheetName: string) => this.dependencyGraph.sheetMapping.getSheetId(sheetName),
        refText,
        state.formulaAddress.sheet,
      )

      if (address === undefined || !this.dependencyGraph.sheetMapping.hasSheetWithId(address.sheet) || !this.isWithinSheetLimits(address)) {
        return new CellError(ErrorType.REF, ErrorMessage.BadRef)
      }

      return this.readCell(address, state)
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
