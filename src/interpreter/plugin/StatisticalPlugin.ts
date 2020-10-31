/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {besseli, besselj, besselk, bessely} from './3rdparty/bessel/bessel'
import {
  beta,
  binomial, centralF,
  chisquare,
  erf,
  erfc,
  exponential,
  gamma,
  gammafn,
  gammaln,
  normal, poisson, weibull
} from './3rdparty/jstat/jstat'
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
    'BETA.DIST': {
      method: 'betadist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'BETADIST': {
      method: 'betadist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'BETA.INV': {
      method: 'betainv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'BETAINV': {
      method: 'betainv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'BINOM.DIST': {
      method: 'binomialdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'BINOMDIST': {
      method: 'binomialdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'BINOM.INV': {
      method: 'binomialinv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, lessThan: 1},
      ]
    },
    'BESSELI': {
      method: 'besselifn',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'BESSELJ': {
      method: 'besseljfn',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'BESSELK': {
      method: 'besselkfn',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'BESSELY': {
      method: 'besselyfn',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'CHISQ.DIST': {
      method: 'chisqdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1, maxValue: 1e10},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'CHISQ.DIST.RT': {
      method: 'chisqdistrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1, maxValue: 1e10},
      ]
    },
    'CHISQ.INV': {
      method: 'chisqinv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1, maxValue: 1e10},
      ]
    },
    'CHISQ.INV.RT': {
      method: 'chisqinvrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'CHIDIST': {
      method: 'chisqdistrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1, maxValue: 1e10},
      ]
    },
    'CHIINV': {
      method: 'chisqinvrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1, maxValue: 1e10},
      ]
    },
    'F.DIST': {
      method: 'fdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'F.DIST.RT': {
      method: 'fdistrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'F.INV': {
      method: 'finv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'F.INV.RT': {
      method: 'finvrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'FDIST': {
      method: 'fdistrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'FINV': {
      method: 'finvrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'WEIBULL.DIST': {
      method: 'weibulldist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'WEIBULL': {
      method: 'weibulldist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'POISSON.DIST': {
      method: 'poissondist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'POISSON': {
      method: 'poissondist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
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
      (y: number) => 1 - 2 / (Math.exp(2 * y) + 1)
    )
  }

  public gamma(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GAMMA'), gammafn)
  }

  public gammadist(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GAMMA.DIST'),
      (value: number, alphaVal: number, betaVal: number, cumulative: boolean) => {
        if(cumulative) {
          return gamma.cdf(value, alphaVal, betaVal)
        } else {
          return gamma.pdf(value, alphaVal, betaVal)
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

  public betadist(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('BETA.DIST'),
      (x: number, alphaVal: number, betaVal: number, cumulative: boolean, A: number, B: number) => {
        if(x<=A) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        } else if(x>=B) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        x = (x - A) / (B - A)
        if(cumulative) {
          return beta.cdf(x, alphaVal, betaVal)
        } else {
          return beta.pdf(x, alphaVal, betaVal)
        }
      }
    )
  }

  public betainv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('BETA.INV'),
      (x: number, alphaVal: number, betaVal: number, A: number, B: number) => {
        if (A >= B) {
          return new CellError(ErrorType.NUM, ErrorMessage.WrongOrder)
        } else {
          return beta.inv(x, alphaVal, betaVal) * (B - A) + A
        }
      }
    )
  }

  public binomialdist(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('BINOM.DIST'),
      (succ: number, trials: number, prob: number, cumulative: boolean) => {
        if(succ>trials) {
          return new CellError(ErrorType.NUM, ErrorMessage.WrongOrder)
        }
        succ = Math.trunc(succ)
        trials = Math.trunc(trials)
        if(cumulative) {
          return binomial.cdf(succ, trials, prob)
        } else {
          return binomial.pdf(succ, trials, prob)
        }
      }
    )
  }

  public binomialinv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('BINOM.INV'),
      (trials: number, prob: number, alpha: number) => {
        trials = Math.trunc(trials)
        let lower = -1
        let upper = trials
        while(upper>lower+1) {
          const mid = Math.trunc((lower+upper)/2)
          if(binomial.cdf(mid, trials, prob) >= alpha) {
            upper = mid
          } else {
            lower = mid
          }
        }
        return upper
      }
    )
  }

  public besselifn(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('BESSELI'),
      (x: number, n: number) => besseli(x, Math.trunc(n))
    )
  }

  public besseljfn(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('BESSELJ'),
      (x: number, n: number) => besselj(x, Math.trunc(n))
    )
  }

  public besselkfn(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('BESSELK'),
      (x: number, n: number) => besselk(x, Math.trunc(n))
    )
  }

  public besselyfn(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('BESSELY'),
      (x: number, n: number) => bessely(x, Math.trunc(n))
    )
  }

  public chisqdist(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CHISQ.DIST'),
      (x: number, deg: number, cumulative: boolean) => {
        deg = Math.trunc(deg)
        if(cumulative) {
          return chisquare.cdf(x, deg)
        } else {
          return chisquare.pdf(x, deg)
        }
      }
    )
  }

  public chisqdistrt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CHISQ.DIST.RT'),
      (x: number, deg: number) => 1 - chisquare.cdf(x, Math.trunc(deg))
    )
  }

  public chisqinv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CHISQ.INV'),
      (p: number, deg: number) => chisquare.inv(p, Math.trunc(deg))
    )
  }

  public chisqinvrt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CHISQ.INV.RT'),
      (p: number, deg: number) => chisquare.inv(1.0 - p, Math.trunc(deg))
    )
  }

  public fdist(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('F.DIST'),
      (x: number, deg1: number, deg2: number, cumulative: boolean) => {
        deg1 = Math.trunc(deg1)
        deg2 = Math.trunc(deg2)
        if(cumulative) {
          return centralF.cdf(x, deg1, deg2)
        } else {
          return centralF.pdf(x, deg1, deg2)
        }
      }
    )
  }

  public fdistrt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('F.DIST.RT'),
      (x: number, deg1: number, deg2: number) => 1 - centralF.cdf(x, Math.trunc(deg1), Math.trunc(deg2))

    )
  }

  public finv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('F.INV'),
      (p: number, deg1: number, deg2: number) => centralF.inv(p, Math.trunc(deg1), Math.trunc(deg2))
    )
  }

  public finvrt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('F.INV.RT'),
      (p: number, deg1: number, deg2: number) => centralF.inv(1.0 - p, Math.trunc(deg1), Math.trunc(deg2))
    )
  }

  public weibulldist(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('WEIBULL.DIST'),
      (x: number, alpha: number, beta: number, cumulative: boolean) => {
        if(cumulative) {
          return weibull.cdf(x, alpha, beta)
        } else {
          return weibull.pdf(x, alpha, beta)
        }
      }
    )
  }

  public poissondist(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('POISSON.DIST'),
      (x: number, mean: number, cumulative: boolean) => {
        x = Math.trunc(x)
        if(cumulative) {
          return poisson.cdf(x, mean)
        } else {
          return poisson.pdf(x, mean)
        }
      }
    )
  }
}

