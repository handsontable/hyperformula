/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {columnIndexToLabel} from '../../parser/addressRepresentationConverters'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'

enum AbsStyle {
  FullyAbsolute = 1,
  RowAbsoluteColRelative = 2,
  RowRelativeColAbsolute = 3,
  FullyRelative = 4,
}

export class AddressPlugin extends FunctionPlugin implements FunctionPluginTypecheck<AddressPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'ADDRESS': {
      method: 'address',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 1, minValue: 1, maxValue: 4},
        {argumentType: FunctionArgumentType.BOOLEAN, optionalArg: true, defaultValue: true},
        {argumentType: FunctionArgumentType.STRING, optionalArg: true},
      ]
    },
  }

  private verifyAddressArguments(row: number, col: number, abs: number, useA1Style: boolean): Maybe<CellError> {
    if (useA1Style) {
      if (row < 1 || col < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }
    } else {
      if (AbsStyle.FullyAbsolute == abs) {
        if (row < 1 || col < 1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
        }
      } else if (AbsStyle.RowAbsoluteColRelative == abs) {
        if (row < 1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
        }
      } else if (AbsStyle.RowRelativeColAbsolute == abs) {
        if (col < 1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
        }
      }
    }
    return undefined
  }

  public address(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ADDRESS'), (row: number, col: number, abs: number, useA1Style: boolean, sheetName: string): InterpreterValue => {
      const argumentError = this.verifyAddressArguments(row, col, abs, useA1Style)

      if (argumentError !== undefined) {
        return argumentError
      }

      const colLetter = columnIndexToLabel(col - 1)
      let sheetPrefix = ''

      if (sheetName !== undefined && sheetName !== null) {
        sheetPrefix = `${sheetName}!`
      }

      const r1c1ColSegment = (col == 0) ? 'C' : `C[${col}]`
      const r1c1RowSegment = (row == 0) ? 'R' : `R[${row}]`

      if (AbsStyle.FullyRelative == abs) {
        return useA1Style ? `${sheetPrefix}${colLetter}${row}` : `${sheetPrefix}${r1c1RowSegment}${r1c1ColSegment}`
      } else if (AbsStyle.RowRelativeColAbsolute == abs) {
        return useA1Style ? `${sheetPrefix}$${colLetter}${row}` : `${sheetPrefix}${r1c1RowSegment}C${col}`
      } else if (AbsStyle.RowAbsoluteColRelative == abs) {
        return useA1Style ? `${sheetPrefix}${colLetter}$${row}` : `${sheetPrefix}R${row}${r1c1ColSegment}`
      }

      return useA1Style ? `${sheetPrefix}$${colLetter}$${row}` : `${sheetPrefix}R${row}C${col}`
    })
  }
}
