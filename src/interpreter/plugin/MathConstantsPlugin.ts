/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

const PI = parseFloat(Math.PI.toFixed(14))
const E = parseFloat(Math.E.toFixed(14))

export class MathConstantsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    pi: {
      translationKey: 'PI',
    },
    e: {
      translationKey: 'E',
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public pi(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length > 0) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    return PI
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public e(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length > 0) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    return E
  }
}
