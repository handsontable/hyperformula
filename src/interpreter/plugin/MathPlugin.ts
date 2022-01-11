/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue, RawInterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class MathPlugin extends FunctionPlugin implements FunctionPluginTypecheck<MathPlugin> {
  public static implementedFunctions = {
    'FACT': {
      method: 'fact',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 170}
      ]
    },
    'FACTDOUBLE': {
      method: 'factdouble',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 288}
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
    'SIGN': {
      method: 'sign',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
      ],
    },
    'SUMX2MY2': {
      method: 'sumx2my2',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
    'SUMX2PY2': {
      method: 'sumx2py2',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
    'SUMXMY2': {
      method: 'sumxmy2',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
  }

  public fact(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FACT'),
      (arg: number) => {
        arg = Math.trunc(arg)
        let ret = 1
        for (let i = 1; i <= arg; i++) {
          ret *= i
        }
        return ret
      })
  }

  public factdouble(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FACTDOUBLE'),
      (arg: number) => {
        arg = Math.trunc(arg)
        let ret = 1
        for (let i = arg; i >= 1; i -= 2) {
          ret *= i
        }
        return ret
      }
    )
  }

  public combin(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('COMBIN'),
      (n: number, m: number) => {
        if (m > n) {
          return new CellError(ErrorType.NUM, ErrorMessage.WrongOrder)
        }
        n = Math.trunc(n)
        m = Math.trunc(m)
        return combin(n, m)
      })
  }

  public combina(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('COMBINA'),
      (n: number, m: number) => {
        n = Math.trunc(n)
        m = Math.trunc(m)
        if (n + m - 1 >= 1030) {
          //Product #2 does not enforce this
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        if (n === 0 && m === 0) {
          return 1
        }
        return combin(n + m - 1, m)
      }
    )
  }

  public gcd(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('GCD'),
      (...args: RawInterpreterValue[]) => {
        const processedArgs = this.arithmeticHelper.coerceNumbersCoerceRangesDropNulls(args)
        if (processedArgs instanceof CellError) {
          return processedArgs
        }
        let ret = 0
        for (const val of processedArgs) {
          if (val < 0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
          ret = binaryGCD(ret, Math.trunc(val))
        }
        if (ret > Number.MAX_SAFE_INTEGER) {
          //inconsistency with product #1
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        return ret
      }
    )
  }

  public lcm(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LCM'),
      (...args: RawInterpreterValue[]) => {
        const processedArgs = this.arithmeticHelper.coerceNumbersCoerceRangesDropNulls(args)
        if (processedArgs instanceof CellError) {
          return processedArgs
        }
        let ret = 1
        for (const val of processedArgs) {
          if (val < 0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
          ret = binaryLCM(ret, Math.trunc(val))
        }
        if (ret > Number.MAX_SAFE_INTEGER) {
          //inconsistency with product #1
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        return ret
      }
    )
  }

  public mround(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MROUND'),
      (nom: number, denom: number) => {
        if (denom === 0) {
          return 0
        }
        if ((nom > 0 && denom < 0) || (nom < 0 && denom > 0)) {
          return new CellError(ErrorType.NUM, ErrorMessage.DistinctSigns)
        }
        return Math.round(nom / denom) * denom
      }
    )
  }

  public multinomial(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MULTINOMIAL'),
      (...args: number[]) => {
        let n = 0
        let ans = 1
        for (let arg of args) {
          if (arg < 0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
          arg = Math.trunc(arg)
          for (let i = 1; i <= arg; i++) {
            ans *= (n + i) / i
          }
          n += arg
        }
        return Math.round(ans)
      }
    )
  }

  public quotient(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('QUOTIENT'),
      (nom: number, denom: number) => {
        if (denom === 0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        return Math.trunc(nom / denom)
      }
    )
  }

  public seriessum(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SERIESSUM'),
      (x: number, n: number, m: number, range: SimpleRangeValue) => {
        const coefs = this.arithmeticHelper.manyToOnlyNumbersDropNulls(range.valuesFromTopLeftCorner())
        if (coefs instanceof CellError) {
          return coefs
        }
        let ret = 0
        coefs.reverse()
        for (const coef of coefs) {
          ret *= Math.pow(x, m)
          ret += coef
        }
        return ret * Math.pow(x, n)
      }
    )
  }

  public sign(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SIGN'),
      (arg: number) => {
        if (arg > 0) {
          return 1
        } else if (arg < 0) {
          return -1
        } else {
          return 0
        }
      }
    )
  }

  public sumx2my2(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SUMX2MY2'),
      (rangeX: SimpleRangeValue, rangeY: SimpleRangeValue) => {
        const valsX = rangeX.valuesFromTopLeftCorner()
        const valsY = rangeY.valuesFromTopLeftCorner()
        if (valsX.length !== valsY.length) {
          return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
        }
        const n = valsX.length
        let ret = 0
        for (let i = 0; i < n; i++) {
          const valX = valsX[i]
          const valY = valsY[i]
          if (valX instanceof CellError) {
            return valX
          }
          if (valY instanceof CellError) {
            return valY
          }
          if (typeof valX === 'number' && typeof valY === 'number') {
            ret += Math.pow(valX, 2) - Math.pow(valY, 2)
          }
        }
        return ret
      }
    )
  }

  public sumx2py2(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SUMX2PY2'),
      (rangeX: SimpleRangeValue, rangeY: SimpleRangeValue) => {
        const valsX = rangeX.valuesFromTopLeftCorner()
        const valsY = rangeY.valuesFromTopLeftCorner()
        if (valsX.length !== valsY.length) {
          return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
        }
        const n = valsX.length
        let ret = 0
        for (let i = 0; i < n; i++) {
          const valX = valsX[i]
          const valY = valsY[i]
          if (valX instanceof CellError) {
            return valX
          }
          if (valY instanceof CellError) {
            return valY
          }
          if (typeof valX === 'number' && typeof valY === 'number') {
            ret += Math.pow(valX, 2) + Math.pow(valY, 2)
          }
        }
        return ret
      }
    )
  }

  public sumxmy2(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SUMXMY2'),
      (rangeX: SimpleRangeValue, rangeY: SimpleRangeValue) => {
        const valsX = rangeX.valuesFromTopLeftCorner()
        const valsY = rangeY.valuesFromTopLeftCorner()
        if (valsX.length !== valsY.length) {
          return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
        }
        const n = valsX.length
        let ret = 0
        for (let i = 0; i < n; i++) {
          const valX = valsX[i]
          const valY = valsY[i]
          if (valX instanceof CellError) {
            return valX
          }
          if (valY instanceof CellError) {
            return valY
          }
          if (typeof valX === 'number' && typeof valY === 'number') {
            ret += Math.pow(valX - valY, 2)
          }
        }
        return ret
      }
    )
  }
}

function combin(n: number, m: number): number {
  if (2 * m > n) {
    m = n - m
  }
  let ret = 1
  for (let i = 1; i <= m; i++) {
    ret *= (n - m + i) / i
  }
  return Math.round(ret)
}

function binaryGCD(a: number, b: number): number {
  if (a < b) {
    [a, b] = [b, a]
  }
  while (b > 0) {
    [a, b] = [b, a % b]
  }
  return a
}

function binaryLCM(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0
  }
  return a * (b / binaryGCD(a, b))
}
