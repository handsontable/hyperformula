/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {besseli, besselj, besselk, bessely} from './3rdparty/bessel/bessel'
import {
  beta,
  binomial,
  centralF,
  chisquare,
  erf,
  erfc,
  exponential,
  gamma,
  gammafn,
  gammaln,
  hypgeom,
  lognormal,
  negbin,
  normal,
  normalci,
  poisson,
  studentt,
  tci,
  weibull
} from './3rdparty/jstat/jstat'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class StatisticalPlugin extends FunctionPlugin implements FunctionPluginTypecheck<StatisticalPlugin> {
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
    'GAMMALN': {
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
    'BINOM.DIST': {
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
    'WEIBULL.DIST': {
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
    'HYPGEOM.DIST': {
      method: 'hypgeomdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'T.DIST': {
      method: 'tdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'T.DIST.2T': {
      method: 'tdist2t',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'T.DIST.RT': {
      method: 'tdistrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'TDIST': {
      method: 'tdistold',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1, maxValue: 2},
      ]
    },
    'T.INV': {
      method: 'tinv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, lessThan: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'T.INV.2T': {
      method: 'tinv2t',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, maxValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'LOGNORM.DIST': {
      method: 'lognormdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'LOGNORM.INV': {
      method: 'lognorminv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, lessThan: 1},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ]
    },
    'NORM.DIST': {
      method: 'normdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'NORM.INV': {
      method: 'norminv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, lessThan: 1},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ]
    },
    'NORM.S.DIST': {
      method: 'normsdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'NORM.S.INV': {
      method: 'normsinv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, lessThan: 1},
      ]
    },
    'PHI': {
      method: 'phi',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER}
      ]
    },
    'NEGBINOM.DIST': {
      method: 'negbinomdist',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, maxValue: 1},
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'CONFIDENCE.NORM': {
      method: 'confidencenorm',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, lessThan: 1},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ],
    },
    'CONFIDENCE.T': {
      method: 'confidencet',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, lessThan: 1},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ],
    },
    'STANDARDIZE': {
      method: 'standardize',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ],
    },
  }

  public static aliases = {
    NEGBINOMDIST: 'NEGBINOM.DIST',
    EXPONDIST: 'EXPON.DIST',
    BETADIST: 'BETA.DIST',
    NORMDIST: 'NORM.DIST',
    NORMINV: 'NORM.INV',
    NORMSDIST: 'NORM.S.DIST',
    NORMSINV: 'NORM.S.INV',
    LOGNORMDIST: 'LOGNORM.DIST',
    LOGINV: 'LOGNORM.INV',
    TINV: 'T.INV.2T',
    HYPGEOMDIST: 'HYPGEOM.DIST',
    POISSON: 'POISSON.DIST',
    WEIBULL: 'WEIBULL.DIST',
    FINV: 'F.INV.RT',
    FDIST: 'F.DIST.RT',
    CHIDIST: 'CHISQ.DIST.RT',
    CHIINV: 'CHISQ.INV.RT',
    GAMMADIST: 'GAMMA.DIST',
    'GAMMALN.PRECISE': 'GAMMALN',
    GAMMAINV: 'GAMMA.INV',
    BETAINV: 'BETA.INV',
    BINOMDIST: 'BINOM.DIST',
    CONFIDENCE: 'CONFIDENCE.NORM',
    CRITBINOM: 'BINOM.INV',
    WEIBULLDIST: 'WEIBULL.DIST',
    TINV2T: 'T.INV.2T',
    TDISTRT: 'T.DIST.RT',
    TDIST2T: 'T.DIST.2T',
    FINVRT: 'F.INV.RT',
    FDISTRT: 'F.DIST.RT',
    CHIDISTRT: 'CHISQ.DIST.RT',
    CHIINVRT: 'CHISQ.INV.RT',
    LOGNORMINV: 'LOGNORM.INV',
    POISSONDIST: 'POISSON.DIST',
  }

  public erf(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ERF'), (lowerBound, upperBound) => {
      if (upperBound === undefined) {
        return erf(lowerBound)
      } else {
        return erf(upperBound) - erf(lowerBound)
      }
    })
  }

  public erfc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ERFC'), erfc)
  }

  public expondist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('EXPON.DIST'),
      (x: number, lambda: number, cumulative: boolean) => {
        if (cumulative) {
          return exponential.cdf(x, lambda)
        } else {
          return exponential.pdf(x, lambda)
        }
      }
    )
  }

  public fisher(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FISHER'),
      (x: number) => Math.log((1 + x) / (1 - x)) / 2
    )
  }

  public fisherinv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FISHERINV'),
      (y: number) => 1 - 2 / (Math.exp(2 * y) + 1)
    )
  }

  public gamma(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('GAMMA'), gammafn)
  }

  public gammadist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('GAMMA.DIST'),
      (value: number, alphaVal: number, betaVal: number, cumulative: boolean) => {
        if (cumulative) {
          return gamma.cdf(value, alphaVal, betaVal)
        } else {
          return gamma.pdf(value, alphaVal, betaVal)
        }
      }
    )
  }

  public gammaln(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('GAMMALN'), gammaln)
  }

  public gammainv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('GAMMA.INV'), gamma.inv)
  }

  public gauss(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('GAUSS'),
      (z: number) => normal.cdf(z, 0, 1) - 0.5
    )
  }

  public betadist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BETA.DIST'),
      (x: number, alphaVal: number, betaVal: number, cumulative: boolean, A: number, B: number) => {
        if (x <= A) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        } else if (x >= B) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        x = (x - A) / (B - A)
        if (cumulative) {
          return beta.cdf(x, alphaVal, betaVal)
        } else {
          return beta.pdf(x, alphaVal, betaVal)
        }
      }
    )
  }

  public betainv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BETA.INV'),
      (x: number, alphaVal: number, betaVal: number, A: number, B: number) => {
        if (A >= B) {
          return new CellError(ErrorType.NUM, ErrorMessage.WrongOrder)
        } else {
          return beta.inv(x, alphaVal, betaVal) * (B - A) + A
        }
      }
    )
  }

  public binomialdist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BINOM.DIST'),
      (succ: number, trials: number, prob: number, cumulative: boolean) => {
        if (succ > trials) {
          return new CellError(ErrorType.NUM, ErrorMessage.WrongOrder)
        }
        succ = Math.trunc(succ)
        trials = Math.trunc(trials)
        if (cumulative) {
          return binomial.cdf(succ, trials, prob)
        } else {
          return binomial.pdf(succ, trials, prob)
        }
      }
    )
  }

  public binomialinv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BINOM.INV'),
      (trials: number, prob: number, alpha: number) => {
        trials = Math.trunc(trials)
        let lower = -1
        let upper = trials
        while (upper > lower + 1) {
          const mid = Math.trunc((lower + upper) / 2)
          if (binomial.cdf(mid, trials, prob) >= alpha) {
            upper = mid
          } else {
            lower = mid
          }
        }
        return upper
      }
    )
  }

  public besselifn(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BESSELI'),
      (x: number, n: number) => besseli(x, Math.trunc(n))
    )
  }

  public besseljfn(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BESSELJ'),
      (x: number, n: number) => besselj(x, Math.trunc(n))
    )
  }

  public besselkfn(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BESSELK'),
      (x: number, n: number) => besselk(x, Math.trunc(n))
    )
  }

  public besselyfn(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BESSELY'),
      (x: number, n: number) => bessely(x, Math.trunc(n))
    )
  }

  public chisqdist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CHISQ.DIST'),
      (x: number, deg: number, cumulative: boolean) => {
        deg = Math.trunc(deg)
        if (cumulative) {
          return chisquare.cdf(x, deg)
        } else {
          return chisquare.pdf(x, deg)
        }
      }
    )
  }

  public chisqdistrt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CHISQ.DIST.RT'),
      (x: number, deg: number) => 1 - chisquare.cdf(x, Math.trunc(deg))
    )
  }

  public chisqinv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CHISQ.INV'),
      (p: number, deg: number) => chisquare.inv(p, Math.trunc(deg))
    )
  }

  public chisqinvrt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CHISQ.INV.RT'),
      (p: number, deg: number) => chisquare.inv(1.0 - p, Math.trunc(deg))
    )
  }

  public fdist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('F.DIST'),
      (x: number, deg1: number, deg2: number, cumulative: boolean) => {
        deg1 = Math.trunc(deg1)
        deg2 = Math.trunc(deg2)
        if (cumulative) {
          return centralF.cdf(x, deg1, deg2)
        } else {
          return centralF.pdf(x, deg1, deg2)
        }
      }
    )
  }

  public fdistrt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('F.DIST.RT'),
      (x: number, deg1: number, deg2: number) => 1 - centralF.cdf(x, Math.trunc(deg1), Math.trunc(deg2))
    )
  }

  public finv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('F.INV'),
      (p: number, deg1: number, deg2: number) => centralF.inv(p, Math.trunc(deg1), Math.trunc(deg2))
    )
  }

  public finvrt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('F.INV.RT'),
      (p: number, deg1: number, deg2: number) => centralF.inv(1.0 - p, Math.trunc(deg1), Math.trunc(deg2))
    )
  }

  public weibulldist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('WEIBULL.DIST'),
      (x: number, shape: number, scale: number, cumulative: boolean) => {
        if (cumulative) {
          return weibull.cdf(x, scale, shape)
        } else {
          return weibull.pdf(x, scale, shape)
        }
      }
    )
  }

  public poissondist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('POISSON.DIST'),
      (x: number, mean: number, cumulative: boolean) => {
        x = Math.trunc(x)
        if (cumulative) {
          return poisson.cdf(x, mean)
        } else {
          return poisson.pdf(x, mean)
        }
      }
    )
  }

  public hypgeomdist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HYPGEOM.DIST'),
      (s: number, numberS: number, populationS: number, numberPop: number, cumulative: boolean) => {
        if (s > numberS || s > populationS || numberS > numberPop || populationS > numberPop) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        if (s + numberPop < populationS + numberS) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        s = Math.trunc(s)
        numberS = Math.trunc(numberS)
        populationS = Math.trunc(populationS)
        numberPop = Math.trunc(numberPop)

        if (cumulative) {
          return hypgeom.cdf(s, numberPop, populationS, numberS)
        } else {
          return hypgeom.pdf(s, numberPop, populationS, numberS)
        }
      }
    )
  }

  public tdist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('T.DIST'),
      (x: number, deg: number, cumulative: boolean) => {
        deg = Math.trunc(deg)
        if (cumulative) {
          return studentt.cdf(x, deg)
        } else {
          return studentt.pdf(x, deg)
        }
      }
    )
  }

  public tdist2t(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('T.DIST.2T'),
      (x: number, deg: number) => (1 - studentt.cdf(x, Math.trunc(deg))) * 2
    )
  }

  public tdistrt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('T.DIST.RT'),
      (x: number, deg: number) => 1 - studentt.cdf(x, Math.trunc(deg))
    )
  }

  public tdistold(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TDIST'),
      (x: number, deg: number, mode: number) => mode * (1 - studentt.cdf(x, Math.trunc(deg)))
    )
  }

  public tinv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('T.INV'),
      (p: number, deg: number) => studentt.inv(p, Math.trunc(deg))
    )
  }

  public tinv2t(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('T.INV.2T'),
      (p: number, deg: number) => studentt.inv(1 - p / 2, Math.trunc(deg))
    )
  }

  public lognormdist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LOGNORM.DIST'),
      (x: number, mean: number, stddev: number, cumulative: boolean) => {
        if (cumulative) {
          return lognormal.cdf(x, mean, stddev)
        } else {
          return lognormal.pdf(x, mean, stddev)
        }
      }
    )
  }

  public lognorminv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LOGNORM.INV'),
      (p: number, mean: number, stddev: number) => lognormal.inv(p, mean, stddev)
    )
  }

  public normdist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NORM.DIST'),
      (x: number, mean: number, stddev: number, cumulative: boolean) => {
        if (cumulative) {
          return normal.cdf(x, mean, stddev)
        } else {
          return normal.pdf(x, mean, stddev)
        }
      }
    )
  }

  public norminv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NORM.INV'),
      (p: number, mean: number, stddev: number) => normal.inv(p, mean, stddev)
    )
  }

  public normsdist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NORM.S.DIST'),
      (x: number, cumulative: boolean) => {
        if (cumulative) {
          return normal.cdf(x, 0, 1)
        } else {
          return normal.pdf(x, 0, 1)
        }
      }
    )
  }

  public normsinv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NORM.S.INV'),
      (p: number) => normal.inv(p, 0, 1)
    )
  }

  public phi(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PHI'),
      (x: number) => normal.pdf(x, 0, 1)
    )
  }

  public negbinomdist(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NEGBINOM.DIST'),
      (nf: number, ns: number, p: number, cumulative: boolean) => {
        nf = Math.trunc(nf)
        ns = Math.trunc(ns)
        if (cumulative) {
          return negbin.cdf(nf, ns, p)
        } else {
          return negbin.pdf(nf, ns, p)
        }
      }
    )
  }

  public confidencenorm(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CONFIDENCE.NORM'),
      // eslint-disable-next-line
      // @ts-ignore
      (alpha: number, stddev: number, size: number) => normalci(1, alpha, stddev, Math.trunc(size))[1] - 1
    )
  }

  public confidencet(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CONFIDENCE.T'),
      (alpha: number, stddev: number, size: number) => {
        size = Math.trunc(size)
        if (size === 1) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        // eslint-disable-next-line
        // @ts-ignore
        return tci(1, alpha, stddev, size)[1] - 1
      }
    )
  }

  public standardize(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('STANDARDIZE'),
      (x: number, mean: number, stddev: number) => (x - mean) / stddev
    )
  }
}

