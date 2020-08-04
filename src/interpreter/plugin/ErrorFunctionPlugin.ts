/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class ErrorFunctionPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ERF': {
      method: 'erf',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER, optionalArg: true},
        ]
    },
    'ERFC': {
      method: 'erfc',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER}
        ]
    },
  }

  public erf(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ERF'), (lowerBound, upperBound) => {
      if (upperBound === undefined) {
        return erf(lowerBound)
      } else {
        return erf(upperBound) - erf(lowerBound)
      }
    })
  }

  public erfc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ERFC'), erfc)
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

function erfc(x: number): number {
  return 1 - erf(x)
}
