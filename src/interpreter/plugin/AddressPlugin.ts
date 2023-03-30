/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {columnIndexToLabel} from '../../parser/addressRepresentationConverters'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'

enum AbsStyle {
  FullyAbsolute = 1,
  RowAbsoluteColRelative = 2,
  RowRelativeColAbsolute = 3,
  FullyRelative = 4,
}

export class AddressPlugin extends FunctionPlugin implements FunctionPluginTypecheck<AddressPlugin> {
  public static implementedFunctions = {
    'ADDRESS': {
      method: 'address',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, minValue: 1},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 1},
        {argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 1, minValue: 1, maxValue: 4},
        {argumentType: FunctionArgumentType.BOOLEAN, optionalArg: true, defaultValue: true},
        {argumentType: FunctionArgumentType.STRING, optionalArg: true},
      ]
    },
  }

  public address(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ADDRESS'), (row: number, col: number, abs: number, useA1Style: boolean, sheetName: string): InterpreterValue => {
      if (!useA1Style) {
        return new CellError(ErrorType.NA, ErrorMessage.ArgumentMustEqual('useA1Style', 'TRUE'))
      }

      const colLetter = columnIndexToLabel(col-1)
      let sheetPrefix = ''
      if ((undefined !== sheetName) && (null !== sheetName)) {
        sheetPrefix = `${sheetName}!`
      }

      switch (abs) {
        default:
        case AbsStyle.FullyAbsolute: {
          return `${sheetPrefix}$${colLetter}$${row}`
        }
        case AbsStyle.RowAbsoluteColRelative: {
          return `${sheetPrefix}${colLetter}$${row}`
        }
        case AbsStyle.RowRelativeColAbsolute: {
          return `${sheetPrefix}$${colLetter}${row}`
        }
        case AbsStyle.FullyRelative: {
          return `${sheetPrefix}${colLetter}${row}`
        }
      }
    })
  }
}
