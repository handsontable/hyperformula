import {HyperFormula} from '../../src'

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Function aliases', () => {
  it('NEGBINOMDIST should be an alias of NEGBINOM.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()
        
    expect(engine.getFunctionPlugin('NEGBINOMDIST')!.aliases!['NEGBINOMDIST']).toEqual('NEGBINOM.DIST')
  })

  it('BETADIST should be an alias of BETA.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('BETADIST')!.aliases!['BETADIST']).toEqual('BETA.DIST')
  })

  it('EXPONDIST should be an alias of EXPON.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('EXPONDIST')!.aliases!['EXPONDIST']).toEqual('EXPON.DIST')
  })

  it('NORMDIST should be an alias of NORM.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('NORMDIST')!.aliases!['NORMDIST']).toEqual('NORM.DIST')
  })

  it('NORMINV should be an alias of NORM.INV', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('NORMINV')!.aliases!['NORMINV']).toEqual('NORM.INV')
  })

  it('NORMSDIST should be an alias of NORM.S.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('NORMSDIST')!.aliases!['NORMSDIST']).toEqual('NORM.S.DIST')
  })

  it('NORMSINV should be an alias of NORM.S.INV', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('NORMSINV')!.aliases!['NORMSINV']).toEqual('NORM.S.INV')
  })

  it('LOGINV should be an alias of LOGNORM.INV', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('LOGINV')!.aliases!['LOGINV']).toEqual('LOGNORM.INV')
  })

  it('LOGNORMDIST should be an alias of LOGNORM.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('LOGNORMDIST')!.aliases!['LOGNORMDIST']).toEqual('LOGNORM.DIST')
  })

  it('TINV should be an alias of T.INV.2T', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('TINV')!.aliases!['TINV']).toEqual('T.INV.2T')
  })

  it('HYPGEOMDIST should be an alias of HYPGEOM.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('HYPGEOMDIST')!.aliases!['HYPGEOMDIST']).toEqual('HYPGEOM.DIST')
  })

  it('POISSON should be an alias of POISSON.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('POISSON')!.aliases!['POISSON']).toEqual('POISSON.DIST')
  })

  it('WEIBULL should be an alias of WEIBULL.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('WEIBULL')!.aliases!['WEIBULL']).toEqual('WEIBULL.DIST')
  })

  it('FINV should be an alias of F.INV.RT', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('FINV')!.aliases!['FINV']).toEqual('F.INV.RT')
  })

  it('FDIST should be an alias of F.DIST.RT', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('FDIST')!.aliases!['FDIST']).toEqual('F.DIST.RT')
  })

  it('CHIDIST should be an alias of CHISQ.DIST.RT', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('CHIDIST')!.aliases!['CHIDIST']).toEqual('CHISQ.DIST.RT')
  })

  it('CHIINV should be an alias of CHISQ.INV.RT', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('CHIINV')!.aliases!['CHIINV']).toEqual('CHISQ.INV.RT')
  })

  it('GAMMADIST should be an alias of GAMMA.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('GAMMADIST')!.aliases!['GAMMADIST']).toEqual('GAMMA.DIST')
  })

  it('GAMMALN.PRECISE should be an alias of GAMMALN', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('GAMMALN.PRECISE')!.aliases!['GAMMALN.PRECISE']).toEqual('GAMMALN')
  })

  it('GAMMAINV should be an alias of GAMMA.INV', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('GAMMAINV')!.aliases!['GAMMAINV']).toEqual('GAMMA.INV')
  })

  it('BETAINV should be an alias of BETA.INV', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('BETAINV')!.aliases!['BETAINV']).toEqual('BETA.INV')
  })

  it('BINOMDIST should be an alias of BINOM.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('BINOMDIST')!.aliases!['BINOMDIST']).toEqual('BINOM.DIST')
  })

  it('STDEV should be an alias of STDEV.S', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('STDEV')!.aliases!['STDEV']).toEqual('STDEV.S')
  })

  it('STDEVP should be an alias of STDEV.P', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('STDEVP')!.aliases!['STDEVP']).toEqual('STDEV.P')
  })

  it('VAR should be an alias of VAR.S', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('VAR')!.aliases!['VAR']).toEqual('VAR.S')
  })

  it('VARP should be an alias of VAR.P', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('VARP')!.aliases!['VARP']).toEqual('VAR.P')
  })

  it('CONFIDENCE should be an alias of CONFIDENCE.NORM', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('CONFIDENCE')!.aliases!['CONFIDENCE']).toEqual('CONFIDENCE.NORM')
  })

  it('COVAR should be an alias of COVARIANCE.P', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('COVAR')!.aliases!['COVAR']).toEqual('COVARIANCE.P')
  })

  it('CRITBINOM should be an alias of BINOM.INV', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('CRITBINOM')!.aliases!['CRITBINOM']).toEqual('BINOM.INV')
  })

  it('FTEST should be an alias of F.TEST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('FTEST')!.aliases!['FTEST']).toEqual('F.TEST')
  })

  it('PEARSON should be an alias of CORREL', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('PEARSON')!.aliases!['PEARSON']).toEqual('CORREL')
  })

  it('ZTEST should be an alias of Z.TEST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('ZTEST')!.aliases!['ZTEST']).toEqual('Z.TEST')
  })

  it('WEIBULLDIST should be an alias of WEIBULL.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('WEIBULLDIST')!.aliases!['WEIBULLDIST']).toEqual('WEIBULL.DIST')
  })

  it('VARS should be an alias of VAR.S', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('VARS')!.aliases!['VARS']).toEqual('VAR.S')
  })

  it('TINV2T should be an alias of T.INV.2T', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('TINV2T')!.aliases!['TINV2T']).toEqual('T.INV.2T')
  })

  it('TDISTRT should be an alias of T.DIST.RT', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('TDISTRT')!.aliases!['TDISTRT']).toEqual('T.DIST.RT')
  })

  it('TDIST2T should be an alias of T.DIST.2T', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('TDIST2T')!.aliases!['TDIST2T']).toEqual('T.DIST.2T')
  })

  it('STDEVS should be an alias of STDEV.S', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('STDEVS')!.aliases!['STDEVS']).toEqual('STDEV.S')
  })

  it('FINVRT should be an alias of F.INV.RT', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('FINVRT')!.aliases!['FINVRT']).toEqual('F.INV.RT')
  })

  it('FDISTRT should be an alias of F.DIST.RT', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('FDISTRT')!.aliases!['FDISTRT']).toEqual('F.DIST.RT')
  })

  it('CHIDISTRT should be an alias of CHISQ.DIST.RT', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('CHIDISTRT')!.aliases!['CHIDISTRT']).toEqual('CHISQ.DIST.RT')
  })

  it('CHIINVRT should be an alias of CHISQ.INV.RT', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('CHIINVRT')!.aliases!['CHIINVRT']).toEqual('CHISQ.INV.RT')
  })

  it('COVARIANCEP should be an alias of COVARIANCE.P', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('COVARIANCEP')!.aliases!['COVARIANCEP']).toEqual('COVARIANCE.P')
  })

  it('COVARIANCES should be an alias of COVARIANCE.S', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('COVARIANCES')!.aliases!['COVARIANCES']).toEqual('COVARIANCE.S')
  })

  it('LOGNORMINV should be an alias of LOGNORM.INV', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('LOGNORMINV')!.aliases!['LOGNORMINV']).toEqual('LOGNORM.INV')
  })

  it('POISSONDIST should be an alias of POISSON.DIST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('POISSONDIST')!.aliases!['POISSONDIST']).toEqual('POISSON.DIST')
  })

  it('SKEWP should be an alias of SKEW.P', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('SKEWP')!.aliases!['SKEWP']).toEqual('SKEW.P')
  })

  it('TTEST should be an alias of T.TEST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('TTEST')!.aliases!['TTEST']).toEqual('T.TEST')
  })

  it('CHITEST should be an alias of CHISQ.TEST', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('CHITEST')!.aliases!['CHITEST']).toEqual('CHISQ.TEST')
  })

  it('ISO.CEILING should be an alias of CEILING.PRECISE', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('ISO.CEILING')!.aliases!['ISO.CEILING']).toEqual('CEILING.PRECISE')
  })

  it('TRUNC should be an alias of ROUNDDOWN', async() => {
        const engine = await HyperFormula.buildEmpty()

    expect(engine.getFunctionPlugin('TRUNC')!.aliases!['TRUNC']).toEqual('ROUNDDOWN')
  })
})
