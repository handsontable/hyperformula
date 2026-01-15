import {HyperFormula} from '../../../src'

describe('Function aliases', () => {
  const engine = HyperFormula.buildEmpty()
  it('NEGBINOMDIST should be an alias of NEGBINOM.DIST', () => {
    expect(engine.getFunctionPlugin('NEGBINOMDIST')!.aliases!['NEGBINOMDIST']).toBe('NEGBINOM.DIST')
  })

  it('BETADIST should be an alias of BETA.DIST', () => {
    expect(engine.getFunctionPlugin('BETADIST')!.aliases!['BETADIST']).toBe('BETA.DIST')
  })

  it('EXPONDIST should be an alias of EXPON.DIST', () => {
    expect(engine.getFunctionPlugin('EXPONDIST')!.aliases!['EXPONDIST']).toBe('EXPON.DIST')
  })

  it('NORMDIST should be an alias of NORM.DIST', () => {
    expect(engine.getFunctionPlugin('NORMDIST')!.aliases!['NORMDIST']).toBe('NORM.DIST')
  })

  it('NORMINV should be an alias of NORM.INV', () => {
    expect(engine.getFunctionPlugin('NORMINV')!.aliases!['NORMINV']).toBe('NORM.INV')
  })

  it('NORMSDIST should be an alias of NORM.S.DIST', () => {
    expect(engine.getFunctionPlugin('NORMSDIST')!.aliases!['NORMSDIST']).toBe('NORM.S.DIST')
  })

  it('NORMSINV should be an alias of NORM.S.INV', () => {
    expect(engine.getFunctionPlugin('NORMSINV')!.aliases!['NORMSINV']).toBe('NORM.S.INV')
  })

  it('LOGINV should be an alias of LOGNORM.INV', () => {
    expect(engine.getFunctionPlugin('LOGINV')!.aliases!['LOGINV']).toBe('LOGNORM.INV')
  })

  it('LOGNORMDIST should be an alias of LOGNORM.DIST', () => {
    expect(engine.getFunctionPlugin('LOGNORMDIST')!.aliases!['LOGNORMDIST']).toBe('LOGNORM.DIST')
  })

  it('TINV should be an alias of T.INV.2T', () => {
    expect(engine.getFunctionPlugin('TINV')!.aliases!['TINV']).toBe('T.INV.2T')
  })

  it('HYPGEOMDIST should be an alias of HYPGEOM.DIST', () => {
    expect(engine.getFunctionPlugin('HYPGEOMDIST')!.aliases!['HYPGEOMDIST']).toBe('HYPGEOM.DIST')
  })

  it('POISSON should be an alias of POISSON.DIST', () => {
    expect(engine.getFunctionPlugin('POISSON')!.aliases!['POISSON']).toBe('POISSON.DIST')
  })

  it('WEIBULL should be an alias of WEIBULL.DIST', () => {
    expect(engine.getFunctionPlugin('WEIBULL')!.aliases!['WEIBULL']).toBe('WEIBULL.DIST')
  })

  it('FINV should be an alias of F.INV.RT', () => {
    expect(engine.getFunctionPlugin('FINV')!.aliases!['FINV']).toBe('F.INV.RT')
  })

  it('FDIST should be an alias of F.DIST.RT', () => {
    expect(engine.getFunctionPlugin('FDIST')!.aliases!['FDIST']).toBe('F.DIST.RT')
  })

  it('CHIDIST should be an alias of CHISQ.DIST.RT', () => {
    expect(engine.getFunctionPlugin('CHIDIST')!.aliases!['CHIDIST']).toBe('CHISQ.DIST.RT')
  })

  it('CHIINV should be an alias of CHISQ.INV.RT', () => {
    expect(engine.getFunctionPlugin('CHIINV')!.aliases!['CHIINV']).toBe('CHISQ.INV.RT')
  })

  it('GAMMADIST should be an alias of GAMMA.DIST', () => {
    expect(engine.getFunctionPlugin('GAMMADIST')!.aliases!['GAMMADIST']).toBe('GAMMA.DIST')
  })

  it('GAMMALN.PRECISE should be an alias of GAMMALN', () => {
    expect(engine.getFunctionPlugin('GAMMALN.PRECISE')!.aliases!['GAMMALN.PRECISE']).toBe('GAMMALN')
  })

  it('GAMMAINV should be an alias of GAMMA.INV', () => {
    expect(engine.getFunctionPlugin('GAMMAINV')!.aliases!['GAMMAINV']).toBe('GAMMA.INV')
  })

  it('BETAINV should be an alias of BETA.INV', () => {
    expect(engine.getFunctionPlugin('BETAINV')!.aliases!['BETAINV']).toBe('BETA.INV')
  })

  it('BINOMDIST should be an alias of BINOM.DIST', () => {
    expect(engine.getFunctionPlugin('BINOMDIST')!.aliases!['BINOMDIST']).toBe('BINOM.DIST')
  })

  it('STDEV should be an alias of STDEV.S', () => {
    expect(engine.getFunctionPlugin('STDEV')!.aliases!['STDEV']).toBe('STDEV.S')
  })

  it('STDEVP should be an alias of STDEV.P', () => {
    expect(engine.getFunctionPlugin('STDEVP')!.aliases!['STDEVP']).toBe('STDEV.P')
  })

  it('VAR should be an alias of VAR.S', () => {
    expect(engine.getFunctionPlugin('VAR')!.aliases!['VAR']).toBe('VAR.S')
  })

  it('VARP should be an alias of VAR.P', () => {
    expect(engine.getFunctionPlugin('VARP')!.aliases!['VARP']).toBe('VAR.P')
  })

  it('CONFIDENCE should be an alias of CONFIDENCE.NORM', () => {
    expect(engine.getFunctionPlugin('CONFIDENCE')!.aliases!['CONFIDENCE']).toBe('CONFIDENCE.NORM')
  })

  it('COVAR should be an alias of COVARIANCE.P', () => {
    expect(engine.getFunctionPlugin('COVAR')!.aliases!['COVAR']).toBe('COVARIANCE.P')
  })

  it('CRITBINOM should be an alias of BINOM.INV', () => {
    expect(engine.getFunctionPlugin('CRITBINOM')!.aliases!['CRITBINOM']).toBe('BINOM.INV')
  })

  it('FTEST should be an alias of F.TEST', () => {
    expect(engine.getFunctionPlugin('FTEST')!.aliases!['FTEST']).toBe('F.TEST')
  })

  it('PEARSON should be an alias of CORREL', () => {
    expect(engine.getFunctionPlugin('PEARSON')!.aliases!['PEARSON']).toBe('CORREL')
  })

  it('ZTEST should be an alias of Z.TEST', () => {
    expect(engine.getFunctionPlugin('ZTEST')!.aliases!['ZTEST']).toBe('Z.TEST')
  })

  it('WEIBULLDIST should be an alias of WEIBULL.DIST', () => {
    expect(engine.getFunctionPlugin('WEIBULLDIST')!.aliases!['WEIBULLDIST']).toBe('WEIBULL.DIST')
  })

  it('VARS should be an alias of VAR.S', () => {
    expect(engine.getFunctionPlugin('VARS')!.aliases!['VARS']).toBe('VAR.S')
  })

  it('TINV2T should be an alias of T.INV.2T', () => {
    expect(engine.getFunctionPlugin('TINV2T')!.aliases!['TINV2T']).toBe('T.INV.2T')
  })

  it('TDISTRT should be an alias of T.DIST.RT', () => {
    expect(engine.getFunctionPlugin('TDISTRT')!.aliases!['TDISTRT']).toBe('T.DIST.RT')
  })

  it('TDIST2T should be an alias of T.DIST.2T', () => {
    expect(engine.getFunctionPlugin('TDIST2T')!.aliases!['TDIST2T']).toBe('T.DIST.2T')
  })

  it('STDEVS should be an alias of STDEV.S', () => {
    expect(engine.getFunctionPlugin('STDEVS')!.aliases!['STDEVS']).toBe('STDEV.S')
  })

  it('FINVRT should be an alias of F.INV.RT', () => {
    expect(engine.getFunctionPlugin('FINVRT')!.aliases!['FINVRT']).toBe('F.INV.RT')
  })

  it('FDISTRT should be an alias of F.DIST.RT', () => {
    expect(engine.getFunctionPlugin('FDISTRT')!.aliases!['FDISTRT']).toBe('F.DIST.RT')
  })

  it('CHIDISTRT should be an alias of CHISQ.DIST.RT', () => {
    expect(engine.getFunctionPlugin('CHIDISTRT')!.aliases!['CHIDISTRT']).toBe('CHISQ.DIST.RT')
  })

  it('CHIINVRT should be an alias of CHISQ.INV.RT', () => {
    expect(engine.getFunctionPlugin('CHIINVRT')!.aliases!['CHIINVRT']).toBe('CHISQ.INV.RT')
  })

  it('COVARIANCEP should be an alias of COVARIANCE.P', () => {
    expect(engine.getFunctionPlugin('COVARIANCEP')!.aliases!['COVARIANCEP']).toBe('COVARIANCE.P')
  })

  it('COVARIANCES should be an alias of COVARIANCE.S', () => {
    expect(engine.getFunctionPlugin('COVARIANCES')!.aliases!['COVARIANCES']).toBe('COVARIANCE.S')
  })

  it('LOGNORMINV should be an alias of LOGNORM.INV', () => {
    expect(engine.getFunctionPlugin('LOGNORMINV')!.aliases!['LOGNORMINV']).toBe('LOGNORM.INV')
  })

  it('POISSONDIST should be an alias of POISSON.DIST', () => {
    expect(engine.getFunctionPlugin('POISSONDIST')!.aliases!['POISSONDIST']).toBe('POISSON.DIST')
  })

  it('SKEWP should be an alias of SKEW.P', () => {
    expect(engine.getFunctionPlugin('SKEWP')!.aliases!['SKEWP']).toBe('SKEW.P')
  })

  it('TTEST should be an alias of T.TEST', () => {
    expect(engine.getFunctionPlugin('TTEST')!.aliases!['TTEST']).toBe('T.TEST')
  })

  it('CHITEST should be an alias of CHISQ.TEST', () => {
    expect(engine.getFunctionPlugin('CHITEST')!.aliases!['CHITEST']).toBe('CHISQ.TEST')
  })

  it('ISO.CEILING should be an alias of CEILING.PRECISE', () => {
    expect(engine.getFunctionPlugin('ISO.CEILING')!.aliases!['ISO.CEILING']).toBe('CEILING.PRECISE')
  })

  it('TRUNC should be an alias of ROUNDDOWN', () => {
    expect(engine.getFunctionPlugin('TRUNC')!.aliases!['TRUNC']).toBe('ROUNDDOWN')
  })
})
