import {HyperFormula} from '../../src'

describe('Function aliases', () => {
  it('NEGBINOMDIST should be an alias of NEGBINOM.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('NEGBINOMDIST')!.aliases!['NEGBINOMDIST']).toEqual('NEGBINOM.DIST')
  })

  it('BETADIST should be an alias of BETA.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('BETADIST')!.aliases!['BETADIST']).toEqual('BETA.DIST')
  })

  it('EXPONDIST should be an alias of EXPON.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('EXPONDIST')!.aliases!['EXPONDIST']).toEqual('EXPON.DIST')
  })

  it('NORMDIST should be an alias of NORM.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('NORMDIST')!.aliases!['NORMDIST']).toEqual('NORM.DIST')
  })

  it('NORMINV should be an alias of NORM.INV', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('NORMINV')!.aliases!['NORMINV']).toEqual('NORM.INV')
  })

  it('NORMSDIST should be an alias of NORM.S.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('NORMSDIST')!.aliases!['NORMSDIST']).toEqual('NORM.S.DIST')
  })

  it('NORMSINV should be an alias of NORM.S.INV', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('NORMSINV')!.aliases!['NORMSINV']).toEqual('NORM.S.INV')
  })

  it('LOGINV should be an alias of LOGNORM.INV', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('LOGINV')!.aliases!['LOGINV']).toEqual('LOGNORM.INV')
  })

  it('LOGNORMDIST should be an alias of LOGNORM.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('LOGNORMDIST')!.aliases!['LOGNORMDIST']).toEqual('LOGNORM.DIST')
  })

  it('TINV should be an alias of T.INV.2T', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('TINV')!.aliases!['TINV']).toEqual('T.INV.2T')
  })

  it('HYPGEOMDIST should be an alias of HYPGEOM.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('HYPGEOMDIST')!.aliases!['HYPGEOMDIST']).toEqual('HYPGEOM.DIST')
  })

  it('POISSON should be an alias of POISSON.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('POISSON')!.aliases!['POISSON']).toEqual('POISSON.DIST')
  })

  it('WEIBULL should be an alias of WEIBULL.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('WEIBULL')!.aliases!['WEIBULL']).toEqual('WEIBULL.DIST')
  })

  it('FINV should be an alias of F.INV.RT', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('FINV')!.aliases!['FINV']).toEqual('F.INV.RT')
  })

  it('FDIST should be an alias of F.DIST.RT', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('FDIST')!.aliases!['FDIST']).toEqual('F.DIST.RT')
  })

  it('CHIDIST should be an alias of CHISQ.DIST.RT', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('CHIDIST')!.aliases!['CHIDIST']).toEqual('CHISQ.DIST.RT')
  })

  it('CHIINV should be an alias of CHISQ.INV.RT', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('CHIINV')!.aliases!['CHIINV']).toEqual('CHISQ.INV.RT')
  })

  it('GAMMADIST should be an alias of GAMMA.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('GAMMADIST')!.aliases!['GAMMADIST']).toEqual('GAMMA.DIST')
  })

  it('GAMMALN.PRECISE should be an alias of GAMMALN', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('GAMMALN.PRECISE')!.aliases!['GAMMALN.PRECISE']).toEqual('GAMMALN')
  })

  it('GAMMAINV should be an alias of GAMMA.INV', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('GAMMAINV')!.aliases!['GAMMAINV']).toEqual('GAMMA.INV')
  })

  it('BETAINV should be an alias of BETA.INV', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('BETAINV')!.aliases!['BETAINV']).toEqual('BETA.INV')
  })

  it('BINOMDIST should be an alias of BINOM.DIST', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('BINOMDIST')!.aliases!['BINOMDIST']).toEqual('BINOM.DIST')
  })

  it('STDEV should be an alias of STDEV.S', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('STDEV')!.aliases!['STDEV']).toEqual('STDEV.S')
  })

  it('STDEVP should be an alias of STDEV.P', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('STDEVP')!.aliases!['STDEVP']).toEqual('STDEV.P')
  })

  it('VAR should be an alias of VAR.S', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('VAR')!.aliases!['VAR']).toEqual('VAR.S')
  })

  it('VARP should be an alias of VAR.P', () => {
    expect(HyperFormula.buildEmpty().getFunctionPlugin('VARP')!.aliases!['VARP']).toEqual('VAR.P')
  })
})


describe('Function CONFIDENCE', () => {
  it('should be an alias of CONFIDENCE.NORM', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('CONFIDENCE')?.implementedFunctions!['CONFIDENCE']
    const metadata2 = engine.getFunctionPlugin('CONFIDENCE.NORM')?.implementedFunctions!['CONFIDENCE.NORM']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function COVAR', () => {
  it('should be an alias of COVARIANCE.P', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('COVAR')?.implementedFunctions!['COVAR']
    const metadata2 = engine.getFunctionPlugin('COVARIANCE.P')?.implementedFunctions!['COVARIANCE.P']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function CRITBINOM', () => {
  it('should be an alias of BINOM.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('CRITBINOM')?.implementedFunctions!['CRITBINOM']
    const metadata2 = engine.getFunctionPlugin('BINOM.INV')?.implementedFunctions!['BINOM.INV']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function FTEST', () => {
  it('should be an alias of F.TEST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('FTEST')?.implementedFunctions!['FTEST']
    const metadata2 = engine.getFunctionPlugin('F.TEST')?.implementedFunctions!['F.TEST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function PEARSON', () => {
  it('should be an alias of CORREL', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('PEARSON')?.implementedFunctions!['PEARSON']
    const metadata2 = engine.getFunctionPlugin('CORREL')?.implementedFunctions!['CORREL']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function ZTEST', () => {
  it('should be an alias of Z.TEST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('ZTEST')?.implementedFunctions!['ZTEST']
    const metadata2 = engine.getFunctionPlugin('Z.TEST')?.implementedFunctions!['Z.TEST']
    expect(metadata1).toEqual(metadata2)
  })
})
