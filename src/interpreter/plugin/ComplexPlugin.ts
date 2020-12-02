/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {coerceComplexToString, complex} from '../ArithmeticHelper'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'
import {InterpreterValue} from '../InterpreterValue'

export class ComplexPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'COMPLEX': {
      method: 'complex',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.STRING, defaultValue: 'i' },
      ],
    },
    'IMABS': {
      method: 'imabs',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMAGINARY': {
      method: 'imaginary',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMREAL': {
      method: 'imreal',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMARGUMENT': {
      method: 'imargument',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMCONJUGATE': {
      method: 'imconjugate',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMCOS': {
      method: 'imcos',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMCOSH': {
      method: 'imcosh',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMCOT': {
      method: 'imcot',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMCSC': {
      method: 'imcsc',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMCSCH': {
      method: 'imcsch',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMSEC': {
      method: 'imsec',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMSECH': {
      method: 'imsech',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMSIN': {
      method: 'imsin',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMSINH': {
      method: 'imsinh',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMTAN': {
      method: 'imtan',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMDIV': {
      method: 'imdiv',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMPRODUCT': {
      method: 'improduct',
      parameters: [
        { argumentType: ArgumentTypes.ANY },
      ],
      repeatLastArgs: 1,
    },
    'IMSUM': {
      method: 'imsum',
      parameters: [
        { argumentType: ArgumentTypes.ANY },
      ],
      repeatLastArgs: 1,
    },
    'IMSUB': {
      method: 'imsub',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMEXP': {
      method: 'imexp',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMLN': {
      method: 'imln',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMLOG10': {
      method: 'imlog10',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
    'IMLOG2': {
      method: 'imlog2',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
  }

  public complex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COMPLEX'),
      (re: number, im: number, unit: string) => {
        if(unit !== 'i' && unit !== 'j') {
          return new CellError(ErrorType.VALUE, ErrorMessage.ShouldBeIorJ)
        }
        return coerceComplexToString([re, im], unit)
      }
    )
  }

  public imabs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMABS'), abs)
  }

  public imaginary(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMAGINARY'),
      ([re,im]: complex) => im
    )
  }

  public imreal(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMREAL'),
      ([re,im]: complex) => re
    )
  }

  public imargument(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMARGUMENT'),
      ([re,im]: complex) => {
        if(re===0 && im===0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        return Math.atan2(im,re)
      }
    )
  }

  public imconjugate(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMCONJUGATE'),
      ([re,im]: complex) => coerceComplexToString([re,-im])
    )
  }

  public imcos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMCOS'),
      (arg: complex) => coerceComplexToString(cos(arg))
    )
  }

  public imcosh(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMCOSH'),
      (arg: complex) => coerceComplexToString(cosh(arg))
    )
  }

  public imcot(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMCOT'),
      (arg: complex) => coerceComplexToString(div(cos(arg),sin(arg)))
    )
  }

  public imcsc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMCSC'),
      (arg: complex) => coerceComplexToString(div([1,0],sin(arg)))
    )
  }

  public imcsch(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMCSCH'),
      (arg: complex) => coerceComplexToString(div([1,0],sinh(arg)))
    )
  }

  public imsec(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMSEC'),
      (arg: complex) => coerceComplexToString(div([1,0],cos(arg)))
    )
  }

  public imsech(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMSECH'),
      (arg: complex) => coerceComplexToString(div([1,0],cosh(arg)))
    )
  }

  public imsin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMSIN'),
      (arg: complex) => coerceComplexToString(sin(arg))
    )
  }

  public imsinh(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMSINH'),
      (arg: complex) => coerceComplexToString(sinh(arg))
    )
  }

  public imtan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMTAN'),
      (arg: complex) => coerceComplexToString(div(sin(arg),cos(arg)))
    )
  }

  public imdiv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMDIV'),
      (arg1: complex, arg2: complex) => coerceComplexToString(div(arg1, arg2))
    )
  }

  public improduct(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMPRODUCT'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceComplexExactRanges(args)
        if (coerced instanceof CellError) {
          return coerced
        }
        let prod: complex = [1,0]
        for(const val of coerced) {
          prod = mul(prod, val)
        }
        return coerceComplexToString(prod)
      }
    )
  }

  public imsum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMSUM'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceComplexExactRanges(args)
        if (coerced instanceof CellError) {
          return coerced
        }
        let sum: complex = [0,0]
        for(const val of coerced) {
          sum = add(sum, val)
        }
        return coerceComplexToString(sum)
      }
    )
  }

  public imsub(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMSUB'),
      (arg1: complex, arg2: complex) => coerceComplexToString(sub(arg1, arg2))
    )
  }

  public imexp(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMEXP'),
      (arg: complex) => coerceComplexToString(exp(arg))
    )
  }

  public imln(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMLN'),
      (arg: complex) => coerceComplexToString(ln(arg))
    )
  }

  public imlog10(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMLOG10'),
      (arg: complex) => {
        const [re,im] = ln(arg)
        const c = Math.log(10)
        return coerceComplexToString([re/c, im/c])
      }
    )
  }

  public imlog2(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMLOG2'),
      (arg: complex) => {
        const [re,im] = ln(arg)
        const c = Math.log(2)
        return coerceComplexToString([re/c, im/c])
      }
    )
  }
}

function add([re1,im1]: complex, [re2,im2]: complex): complex {
  return [re1+re2,im1+im2]
}

function sub([re1,im1]: complex, [re2,im2]: complex): complex {
  return [re1-re2,im1-im2]
}

function mul([re1,im1]: complex, [re2,im2]: complex): complex {
  return [re1*re2-im1*im2,re1*im2+re2*im1]
}

function div([re1,im1]: complex, [re2,im2]: complex): complex {
  const denom = Math.pow(re2,2)+Math.pow(im2,2)
  const [nomRe,nomIm] = mul([re1,im1],[re2,-im2])
  return [nomRe/denom,nomIm/denom]
}

function cos([re,im]: complex): complex {
  return [Math.cos(re)*Math.cosh(im), -Math.sin(re)*Math.sinh(im)]
}

function cosh([re,im]: complex): complex {
  return [Math.cosh(re)*Math.cos(im), Math.sinh(re)*Math.sin(im)]
}

function sin([re,im]: complex): complex {
  return [Math.sin(re)*Math.cosh(im),Math.cos(re)*Math.sinh(im)]
}

function sinh([re,im]: complex): complex {
  return [Math.sinh(re)*Math.cos(im),Math.cosh(re)*Math.sin(im)]
}

function exp([re,im]: complex): complex {
  return [Math.exp(re)*Math.cos(im),Math.exp(re)*Math.sin(im)]
}

function abs([re,im]: complex): number {
  return Math.sqrt(re*re+im*im)
}

function ln([re,im]: complex): complex {
  return [Math.log(abs([re,im])), Math.atan2(im,re)]
}
