/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class MathPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FACT': {
      method: 'fact',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, lessThan: 171}
      ]
    },
    'FACTDOUBLE': {
      method: 'factdouble',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, lessThan: 289}
      ]
    },
    'COMBIN': {
      method: 'combin',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, lessThan: 1030},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0}
      ]
    },
    'COMBINA': {
      method: 'combina',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0}
      ]
    },
  }

  public fact(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FACT'),
      (arg: number) => {
        arg = Math.trunc(arg)
        let ret = 1
        for(let i=1; i<=arg; i++) {
          ret *= i
        }
        return ret
      })
  }

  public factdouble(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FACTDOUBLE'),
      (arg: number) => {
        arg = Math.trunc(arg)
        let ret = 1
        for(let i=arg; i>=1; i-=2) {
          ret *= i
        }
        return ret
      }
    )
  }

  public combin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COMBIN'),
      (n: number, m: number) => {
        if(m>n) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        n = Math.trunc(n)
        m = Math.trunc(m)
        return combin(n, m)
    })
  }

  public combina(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COMBINA'),
      (n: number, m: number)  => {
        n = Math.trunc(n)
        m = Math.trunc(m)
        if(n+m-1 >= 1030) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        if(n===0 && m===0) {
          return 1
        }
        return combin(n+m-1,m)
      }
    )
  }
}

function combin(n: number, m: number): number {
  if(2*m>n) {
    m = n-m
  }
  let ret = 1
  let j=1, i=n-m+1
  while(i<=n || j<=m) {
    if(i>n) {
      ret /= j
      j++
    } else if(j>m) {
      ret *= i
      i++
    } else if(ret<1000000000) {
      ret *= i
      i++
    } else {
      ret /= j
      j++
    }
  }
  return Math.round(ret)
}
