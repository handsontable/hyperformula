import {HyperFormula} from '../../src'

describe('Function aliases', () => {
  const engine = HyperFormula.buildEmpty()
  it('NEGBINOMDIST should be an alias of NEGBINOM.DIST', () => {
    expect(engine.getFunctionPlugin('NEGBINOMDIST')!.aliases!['NEGBINOMDIST']).toEqual('NEGBINOM.DIST')
  })

  it('BETADIST should be an alias of BETA.DIST', () => {
    expect(engine.getFunctionPlugin('BETADIST')!.aliases!['BETADIST']).toEqual('BETA.DIST')
  })

  it('EXPONDIST should be an alias of EXPON.DIST', () => {
    expect(engine.getFunctionPlugin('EXPONDIST')!.aliases!['EXPONDIST']).toEqual('EXPON.DIST')
  })

  it('NORMDIST should be an alias of NORM.DIST', () => {
    expect(engine.getFunctionPlugin('NORMDIST')!.aliases!['NORMDIST']).toEqual('NORM.DIST')
  })

  it('NORMINV should be an alias of NORM.INV', () => {
    expect(engine.getFunctionPlugin('NORMINV')!.aliases!['NORMINV']).toEqual('NORM.INV')
  })

  it('NORMSDIST should be an alias of NORM.S.DIST', () => {
    expect(engine.getFunctionPlugin('NORMSDIST')!.aliases!['NORMSDIST']).toEqual('NORM.S.DIST')
  })

  it('NORMSINV should be an alias of NORM.S.INV', () => {
    expect(engine.getFunctionPlugin('NORMSINV')!.aliases!['NORMSINV']).toEqual('NORM.S.INV')
  })

  it('LOGINV should be an alias of LOGNORM.INV', () => {
    expect(engine.getFunctionPlugin('LOGINV')!.aliases!['LOGINV']).toEqual('LOGNORM.INV')
  })

  it('LOGNORMDIST should be an alias of LOGNORM.DIST', () => {
    expect(engine.getFunctionPlugin('LOGNORMDIST')!.aliases!['LOGNORMDIST']).toEqual('LOGNORM.DIST')
  })

  it('TINV should be an alias of T.INV.2T', () => {
    expect(engine.getFunctionPlugin('TINV')!.aliases!['TINV']).toEqual('T.INV.2T')
  })

  it('HYPGEOMDIST should be an alias of HYPGEOM.DIST', () => {
    expect(engine.getFunctionPlugin('HYPGEOMDIST')!.aliases!['HYPGEOMDIST']).toEqual('HYPGEOM.DIST')
  })

  it('POISSON should be an alias of POISSON.DIST', () => {
    expect(engine.getFunctionPlugin('POISSON')!.aliases!['POISSON']).toEqual('POISSON.DIST')
  })

  it('WEIBULL should be an alias of WEIBULL.DIST', () => {
    expect(engine.getFunctionPlugin('WEIBULL')!.aliases!['WEIBULL']).toEqual('WEIBULL.DIST')
  })

  it('FINV should be an alias of F.INV.RT', () => {
    expect(engine.getFunctionPlugin('FINV')!.aliases!['FINV']).toEqual('F.INV.RT')
  })

  it('FDIST should be an alias of F.DIST.RT', () => {
    expect(engine.getFunctionPlugin('FDIST')!.aliases!['FDIST']).toEqual('F.DIST.RT')
  })

  it('CHIDIST should be an alias of CHISQ.DIST.RT', () => {
    expect(engine.getFunctionPlugin('CHIDIST')!.aliases!['CHIDIST']).toEqual('CHISQ.DIST.RT')
  })

  it('CHIINV should be an alias of CHISQ.INV.RT', () => {
    expect(engine.getFunctionPlugin('CHIINV')!.aliases!['CHIINV']).toEqual('CHISQ.INV.RT')
  })

  it('GAMMADIST should be an alias of GAMMA.DIST', () => {
    expect(engine.getFunctionPlugin('GAMMADIST')!.aliases!['GAMMADIST']).toEqual('GAMMA.DIST')
  })

  it('GAMMALN.PRECISE should be an alias of GAMMALN', () => {
    expect(engine.getFunctionPlugin('GAMMALN.PRECISE')!.aliases!['GAMMALN.PRECISE']).toEqual('GAMMALN')
  })

  it('GAMMAINV should be an alias of GAMMA.INV', () => {
    expect(engine.getFunctionPlugin('GAMMAINV')!.aliases!['GAMMAINV']).toEqual('GAMMA.INV')
  })

  it('BETAINV should be an alias of BETA.INV', () => {
    expect(engine.getFunctionPlugin('BETAINV')!.aliases!['BETAINV']).toEqual('BETA.INV')
  })

  it('BINOMDIST should be an alias of BINOM.DIST', () => {
    expect(engine.getFunctionPlugin('BINOMDIST')!.aliases!['BINOMDIST']).toEqual('BINOM.DIST')
  })

  it('STDEV should be an alias of STDEV.S', () => {
    expect(engine.getFunctionPlugin('STDEV')!.aliases!['STDEV']).toEqual('STDEV.S')
  })

  it('STDEVP should be an alias of STDEV.P', () => {
    expect(engine.getFunctionPlugin('STDEVP')!.aliases!['STDEVP']).toEqual('STDEV.P')
  })

  it('VAR should be an alias of VAR.S', () => {
    expect(engine.getFunctionPlugin('VAR')!.aliases!['VAR']).toEqual('VAR.S')
  })

  it('VARP should be an alias of VAR.P', () => {
    expect(engine.getFunctionPlugin('VARP')!.aliases!['VARP']).toEqual('VAR.P')
  })

  it('ISO.CEILING should be an alias of CEILING.PRECISE', () => {
    expect(engine.getFunctionPlugin('ISO.CEILING')!.aliases!['ISO.CEILING']).toEqual('CEILING.PRECISE')
  })
})
