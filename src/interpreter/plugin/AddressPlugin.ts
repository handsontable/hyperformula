/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {columnIndexToLabel} from '../../parser/addressRepresentationConverters'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

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

      const colLetter = columnIndexToLabel(col-1)
      let sheetPrefix = ''
      if ((undefined !== sheetName) && (null !== sheetName)) {
        sheetPrefix = `${sheetName}!`
      }

      if (AbsStyle.FullyRelative == abs) {
        return useA1Style ? `${sheetPrefix}${colLetter}${row}` : `${sheetPrefix}R[${row}]C[${col}]`
      } else if (AbsStyle.RowRelativeColAbsolute == abs) {
        return useA1Style ? `${sheetPrefix}$${colLetter}${row}` : `${sheetPrefix}R[${row}]C${col}`
      } else if (AbsStyle.RowAbsoluteColRelative == abs) {
        return useA1Style ? `${sheetPrefix}${colLetter}$${row}` : `${sheetPrefix}R${row}C[${col}]`
      } else {
        return useA1Style ? `${sheetPrefix}$${colLetter}$${row}` : `${sheetPrefix}R${row}C${col}`
      }
    })
  }
}
