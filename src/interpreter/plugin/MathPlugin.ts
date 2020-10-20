/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'
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
    'GCD': {
      method: 'gcd',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1
    },
    'LCM': {
      method: 'lcm',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1
    },
    'MROUND': {
      method: 'mround',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ],
    },
    'MULTINOMIAL': {
      method: 'multinomial',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'QUOTIENT': {
      method: 'quotient',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ],
    },
    'SERIESSUM': {
      method: 'seriessum',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.RANGE},
      ],
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
        return combin(n+m-1, m)
      }
    )
  }

  public gcd(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GCD'),
      (...args: InterpreterValue[]) => {
        const processedArgs = this.interpreter.arithmeticHelper.coerceNumbersCoerceRangesDropNulls(args)
        if(processedArgs instanceof CellError) {
          return processedArgs
        }
        let ret = 0
        for(const val of processedArgs) {
          if(val<0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
          ret = binaryGCD(ret, Math.trunc(val))
        }
        return ret
      }
    )
  }

  public lcm(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LCM'),
      (...args: InterpreterValue[]) => {
        const processedArgs = this.interpreter.arithmeticHelper.coerceNumbersCoerceRangesDropNulls(args)
        if(processedArgs instanceof CellError) {
          return processedArgs
        }
        let ret = 1
        for(const val of processedArgs) {
          if(val<0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
          ret = binaryLCM(ret, Math.trunc(val))
        }
        return ret
      }
    )
  }

  public mround(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('MROUND'),
      (nom: number, denom: number) => {
        if(denom===0) {
          return 0
        }
        if((nom>0 && denom<0) || (nom<0 && denom>0)) {
          return new CellError(ErrorType.NUM, ErrorMessage.DistinctSigns)
        }
        return Math.round(nom/denom)*denom
      }
    )
  }

  public multinomial(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('MULTINOMIAL'),
      (...args: number[]) => {
        let n = 0
        let ans = 1
        for(let arg of args) {
          if(arg<0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
          arg = Math.trunc(arg)
          for(let i=1;i<=arg;i++) {
            ans *= (n+i)/i
          }
          n += arg
        }
        return Math.round(ans)
      }
    )
  }

  public quotient(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('QUOTIENT'),
      (nom: number, denom: number) => {
        if(denom===0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        return Math.trunc(nom/denom)
      }
    )
  }

  public seriessum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SERIESSUM'),
      (x: number, n: number, m: number, range: SimpleRangeValue) => {
        const coefs = this.interpreter.arithmeticHelper.manyToOnlyNumbersDropNulls(range.valuesFromTopLeftCorner())
        if(coefs instanceof CellError) {
          return coefs
        }
        let ret = 0
        for(const coef of coefs.reverse()) {
          ret *= Math.pow(x, m)
          ret += coef
        }
        return ret * Math.pow(x, n)
      }
    )
  }
}

function combin(n: number, m: number): number {
  if(2*m>n) {
    m = n-m
  }
  let ret = 1
  for(let i=1;i<=m;i++) {
    ret *= (n-m+i)/i
  }
  return Math.round(ret)
}

function binaryGCD(a: number, b: number): number {
  if(a<b) {
    [a, b] = [b, a]
  }
  while(b>0) {
    [a, b] = [b, a%b]
  }
  return a
}

function binaryLCM(a: number, b: number): number {
  if(a==0 || b===0) {
    return 0
  }
  return a * (b/binaryGCD(a, b))
}
