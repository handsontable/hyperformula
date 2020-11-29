/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {coerceComplexToString, complex} from '../ArithmeticHelper'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

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
    'IMARGUMENT': {
      method: 'imargument',
      parameters: [
        { argumentType: ArgumentTypes.COMPLEX },
      ],
    },
  }

  public complex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COMPLEX'),
      ([re, im]: complex, unit: string) => {
        if(unit !== 'i' && unit !== 'j') {
          return new CellError(ErrorType.VALUE, ErrorMessage.ShouldBeIorJ)
        }
        return coerceComplexToString([re, im], unit)
      }
    )
  }

  public imabs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMABS'),
      ([re,im]: complex) => Math.sqrt(re*re+im*im)
    )
  }

  public imaginary(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IMAGINARY'),
      ([re,im]: complex) => im
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
}
