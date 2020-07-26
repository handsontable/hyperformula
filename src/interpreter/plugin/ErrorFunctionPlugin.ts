/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, EmptyValue, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {upperBound} from '../../ColumnSearch/ColumnIndex'
import {AstNodeType, ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class ErrorFunctionPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ERF': {
      method: 'erf',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: EmptyValue as InternalScalarValue}, //hacking around since ERF can take 1 or 2 args
      ],
    },
    'ERFC': {
      method: 'erfc',
      parameters: [
        { argumentType: 'number' }
      ],
    },
  }

  public erf(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, ErrorFunctionPlugin.implementedFunctions.ERF, (lowerBound, upperBound) => {
      if(ast.args.length === 1) {
        return erf(lowerBound)
      }
      return erf2(lowerBound, upperBound)
    })
  }

  public erfc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, ErrorFunctionPlugin.implementedFunctions.ERFC, erfc)
  }
}

function erf(x: number): number {
  if (x >= 0) {
    return erfApprox(x)
  } else {
    return -erfApprox(-x)
  }
}

function erfApprox(x: number): number {
  const polyExponent = 16
  const coefficients = [
    0.0705230784,
    0.0422820123,
    0.0092705272,
    0.0001520143,
    0.0002765672,
    0.0000430638,
  ]

  const poly = coefficients.reduce((acc: number, coefficient: number, index: number) => {
    return acc + coefficient * Math.pow(x, index + 1)
  }, 1)

  return 1 - (1 / Math.pow(poly, polyExponent))
}

function erf2(lowerBound: number, upperBound: number): number {
  return erf(upperBound) - erf(lowerBound)
}

function erfc(x: number): number {
  return 1 - erf(x)
}
