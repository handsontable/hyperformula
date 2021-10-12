/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {coerceComplexToString, complex} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue, RawInterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class ComplexPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ComplexPlugin> {
  public static implementedFunctions = {
    'COMPLEX': {
      method: 'complex',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.STRING, defaultValue: 'i'},
      ],
    },
    'IMABS': {
      method: 'imabs',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMAGINARY': {
      method: 'imaginary',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMREAL': {
      method: 'imreal',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMARGUMENT': {
      method: 'imargument',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMCONJUGATE': {
      method: 'imconjugate',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMCOS': {
      method: 'imcos',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMCOSH': {
      method: 'imcosh',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMCOT': {
      method: 'imcot',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMCSC': {
      method: 'imcsc',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMCSCH': {
      method: 'imcsch',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMSEC': {
      method: 'imsec',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMSECH': {
      method: 'imsech',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMSIN': {
      method: 'imsin',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMSINH': {
      method: 'imsinh',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMTAN': {
      method: 'imtan',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMDIV': {
      method: 'imdiv',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMPRODUCT': {
      method: 'improduct',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1,
    },
    'IMSUM': {
      method: 'imsum',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1,
    },
    'IMSUB': {
      method: 'imsub',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMEXP': {
      method: 'imexp',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMLN': {
      method: 'imln',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMLOG10': {
      method: 'imlog10',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMLOG2': {
      method: 'imlog2',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
    'IMPOWER': {
      method: 'impower',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
        {argumentType: ArgumentTypes.NUMBER},
      ],
    },
    'IMSQRT': {
      method: 'imsqrt',
      parameters: [
        {argumentType: ArgumentTypes.COMPLEX},
      ],
    },
  }

  public complex(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('COMPLEX'),
      (re: number, im: number, unit: string) => {
        if (unit !== 'i' && unit !== 'j') {
          return new CellError(ErrorType.VALUE, ErrorMessage.ShouldBeIorJ)
        }
        return coerceComplexToString([re, im], unit)
      }
    )
  }

  public imabs(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMABS'), abs)
  }

  public imaginary(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMAGINARY'),
      ([_re, im]: complex) => im
    )
  }

  public imreal(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMREAL'),
      ([re, _im]: complex) => re
    )
  }

  public imargument(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMARGUMENT'),
      ([re, im]: complex) => {
        if (re === 0 && im === 0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        return Math.atan2(im, re)
      }
    )
  }

  public imconjugate(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMCONJUGATE'),
      ([re, im]: complex) => coerceComplexToString([re, -im])
    )
  }

  public imcos(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMCOS'),
      (arg: complex) => coerceComplexToString(cos(arg))
    )
  }

  public imcosh(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMCOSH'),
      (arg: complex) => coerceComplexToString(cosh(arg))
    )
  }

  public imcot(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMCOT'),
      (arg: complex) => coerceComplexToString(div(cos(arg), sin(arg)))
    )
  }

  public imcsc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMCSC'),
      (arg: complex) => coerceComplexToString(div([1, 0], sin(arg)))
    )
  }

  public imcsch(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMCSCH'),
      (arg: complex) => coerceComplexToString(div([1, 0], sinh(arg)))
    )
  }

  public imsec(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMSEC'),
      (arg: complex) => coerceComplexToString(div([1, 0], cos(arg)))
    )
  }

  public imsech(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMSECH'),
      (arg: complex) => coerceComplexToString(div([1, 0], cosh(arg)))
    )
  }

  public imsin(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMSIN'),
      (arg: complex) => coerceComplexToString(sin(arg))
    )
  }

  public imsinh(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMSINH'),
      (arg: complex) => coerceComplexToString(sinh(arg))
    )
  }

  public imtan(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMTAN'),
      (arg: complex) => coerceComplexToString(div(sin(arg), cos(arg)))
    )
  }

  public imdiv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMDIV'),
      (arg1: complex, arg2: complex) => coerceComplexToString(div(arg1, arg2))
    )
  }

  public improduct(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMPRODUCT'),
      (...args: RawInterpreterValue[]) => {
        const coerced = this.arithmeticHelper.coerceComplexExactRanges(args)
        if (coerced instanceof CellError) {
          return coerced
        }
        let prod: complex = [1, 0]
        for (const val of coerced) {
          prod = mul(prod, val)
        }
        return coerceComplexToString(prod)
      }
    )
  }

  public imsum(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMSUM'),
      (...args: RawInterpreterValue[]) => {
        const coerced = this.arithmeticHelper.coerceComplexExactRanges(args)
        if (coerced instanceof CellError) {
          return coerced
        }
        let sum: complex = [0, 0]
        for (const val of coerced) {
          sum = add(sum, val)
        }
        return coerceComplexToString(sum)
      }
    )
  }

  public imsub(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMSUB'),
      (arg1: complex, arg2: complex) => coerceComplexToString(sub(arg1, arg2))
    )
  }

  public imexp(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMEXP'),
      (arg: complex) => coerceComplexToString(exp(arg))
    )
  }

  public imln(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMLN'),
      (arg: complex) => coerceComplexToString(ln(arg))
    )
  }

  public imlog10(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMLOG10'),
      (arg: complex) => {
        const [re, im] = ln(arg)
        const c = Math.log(10)
        return coerceComplexToString([re / c, im / c])
      }
    )
  }

  public imlog2(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMLOG2'),
      (arg: complex) => {
        const [re, im] = ln(arg)
        const c = Math.log(2)
        return coerceComplexToString([re / c, im / c])
      }
    )
  }

  public impower(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMPOWER'),
      (arg: complex, n: number) => coerceComplexToString(power(arg, n))
    )
  }

  public imsqrt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IMSQRT'),
      (arg: complex) => coerceComplexToString(power(arg, 0.5))
    )
  }
}

function add([re1, im1]: complex, [re2, im2]: complex): complex {
  return [re1 + re2, im1 + im2]
}

function sub([re1, im1]: complex, [re2, im2]: complex): complex {
  return [re1 - re2, im1 - im2]
}

function mul([re1, im1]: complex, [re2, im2]: complex): complex {
  return [re1 * re2 - im1 * im2, re1 * im2 + re2 * im1]
}

function div([re1, im1]: complex, [re2, im2]: complex): complex {
  const denom = Math.pow(re2, 2) + Math.pow(im2, 2)
  const [nomRe, nomIm] = mul([re1, im1], [re2, -im2])
  return [nomRe / denom, nomIm / denom]
}

function cos([re, im]: complex): complex {
  return [Math.cos(re) * Math.cosh(im), -Math.sin(re) * Math.sinh(im)]
}

function cosh([re, im]: complex): complex {
  return [Math.cosh(re) * Math.cos(im), Math.sinh(re) * Math.sin(im)]
}

function sin([re, im]: complex): complex {
  return [Math.sin(re) * Math.cosh(im), Math.cos(re) * Math.sinh(im)]
}

function sinh([re, im]: complex): complex {
  return [Math.sinh(re) * Math.cos(im), Math.cosh(re) * Math.sin(im)]
}

function exp([re, im]: complex): complex {
  return [Math.exp(re) * Math.cos(im), Math.exp(re) * Math.sin(im)]
}

function abs([re, im]: complex): number {
  return Math.sqrt(re * re + im * im)
}

function ln([re, im]: complex): complex {
  return [Math.log(abs([re, im])), Math.atan2(im, re)]
}

function power(arg: complex, n: number) {
  const [re, im] = ln(arg)
  return exp([n * re, n * im])
}
