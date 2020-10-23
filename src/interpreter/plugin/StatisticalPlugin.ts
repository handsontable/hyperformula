/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {normal, erf, erfc, exponential, gamma, gammafn, gammaln} from './3rdparty/jstat'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class StatisticalPlugin extends  FunctionPlugin {
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
    'EXPON.DIST': {
      method: 'expondist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'EXPONDIST': {
      method: 'expondist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'FISHER': {
      method: 'fisher',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: -1, lessThan: 1}
      ]
    },
    'FISHERINV': {
      method: 'fisherinv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER}
      ]
    },
    'GAMMA': {
      method: 'gamma',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER}
      ]
    },
    'GAMMA.DIST': {
      method: 'gammadist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'GAMMADIST': {
      method: 'gammadist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'GAMMALN': {
      method: 'gammaln',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0}
      ]
    },
    'GAMMALN.PRECISE': {
      method: 'gammaln',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0}
      ]
    },
    'GAMMA.INV': {
      method: 'gammainv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, lessThan: 1},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ]
    },
    'GAMMAINV': {
      method: 'gammainv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, lessThan: 1},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ]
    },
    'GAUSS': {
      method: 'gauss',
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


  public expondist(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('EXPON.DIST'),
      (x: number, lambda: number, cumulative: boolean) => {
        if(cumulative) {
          return exponential.cdf(x, lambda)
        } else {
          return exponential.pdf(x, lambda)
        }
      }
    )
  }

  public fisher(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FISHER'),
      (x: number) => Math.log((1 + x) / (1 - x)) / 2
    )
  }

  public fisherinv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FISHERINV'),
      (y: number) => (Math.exp(2 * y) - 1) / (Math.exp(2 * y) + 1)
    )
  }

  public gamma(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GAMMA'), gammafn)
  }

  public gammadist(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GAMMA.DIST'),
      (value: number, alpha: number, beta: number, cumulative: boolean) => {
        if(cumulative) {
          return gamma.cdf(value, alpha, beta)
        } else {
          return gamma.pdf(value, alpha, beta)
        }
      }
    )
  }

  public gammaln(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GAMMALN'), gammaln)
  }

  public gammainv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GAMMA.INV'), gamma.inv)
  }

  public gauss(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GAUSS'),
      (z: number) => normal.cdf(z, 0, 1) - 0.5
    )
  }
}


