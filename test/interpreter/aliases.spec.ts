import {HyperFormula} from '../../src'

describe('Function NEGBINOMDIST', () => {
  it('should be an alias of NEGBINOM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NEGBINOMDIST')?.implementedFunctions!['NEGBINOMDIST']
    const metadata2 = engine.getFunctionPlugin('NEGBINOM.DIST')?.implementedFunctions!['NEGBINOM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function BETADIST', () => {
  it('should be an alias of BETA.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('BETADIST')?.implementedFunctions!['BETADIST']
    const metadata2 = engine.getFunctionPlugin('BETA.DIST')?.implementedFunctions!['BETA.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function EXPONDIST', () => {
  it('should be an alias of EXPON.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('EXPONDIST')?.implementedFunctions!['EXPONDIST']
    const metadata2 = engine.getFunctionPlugin('EXPON.DIST')?.implementedFunctions!['EXPON.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function NORMDIST', () => {
  it('should be an alias of NORM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NORMDIST')?.implementedFunctions!['NORMDIST']
    const metadata2 = engine.getFunctionPlugin('NORM.DIST')?.implementedFunctions!['NORM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function NORMINV', () => {
  it('should be an alias of NORM.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NORMINV')?.implementedFunctions!['NORMINV']
    const metadata2 = engine.getFunctionPlugin('NORM.INV')?.implementedFunctions!['NORM.INV']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function NORMSDIST', () => {
  it('should be an alias of NORM.S.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NORMSDIST')?.implementedFunctions!['NORMSDIST']
    const metadata2 = engine.getFunctionPlugin('NORM.S.DIST')?.implementedFunctions!['NORM.S.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function NORMSINV', () => {
  it('should be an alias of NORM.S.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NORMSINV')?.implementedFunctions!['NORMSINV']
    const metadata2 = engine.getFunctionPlugin('NORM.S.INV')?.implementedFunctions!['NORM.S.INV']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function LOGINV', () => {
  it('should be an alias of LOGNORM.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('LOGINV')?.implementedFunctions!['LOGINV']
    const metadata2 = engine.getFunctionPlugin('LOGNORM.INV')?.implementedFunctions!['LOGNORM.INV']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function LOGNORMDIST', () => {
  it('should be an alias of LOGNORM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('LOGNORMDIST')?.implementedFunctions!['LOGNORMDIST']
    const metadata2 = engine.getFunctionPlugin('LOGNORM.DIST')?.implementedFunctions!['LOGNORM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function TINV', () => {
  it('should be an alias of T.INV.2T', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('TINV')?.implementedFunctions!['TINV']
    const metadata2 = engine.getFunctionPlugin('T.INV.2T')?.implementedFunctions!['T.INV.2T']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function HYPGEOMDIST', () => {
  it('should be an alias of HYPGEOM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('HYPGEOMDIST')?.implementedFunctions!['HYPGEOMDIST']
    const metadata2 = engine.getFunctionPlugin('HYPGEOM.DIST')?.implementedFunctions!['HYPGEOM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function POISSON', () => {
  it('should be an alias of POISSON.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('POISSON')?.implementedFunctions!['POISSON']
    const metadata2 = engine.getFunctionPlugin('POISSON.DIST')?.implementedFunctions!['POISSON.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function WEIBULL', () => {
  it('should be an alias of WEIBULL.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('WEIBULL')?.implementedFunctions!['WEIBULL']
    const metadata2 = engine.getFunctionPlugin('WEIBULL.DIST')?.implementedFunctions!['WEIBULL.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function FINV', () => {
  it('should be an alias of F.INV.RT', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('FINV')?.implementedFunctions!['FINV']
    const metadata2 = engine.getFunctionPlugin('F.INV.RT')?.implementedFunctions!['F.INV.RT']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function FDIST', () => {
  it('should be an alias of F.DIST.RT', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('FDIST')?.implementedFunctions!['FDIST']
    const metadata2 = engine.getFunctionPlugin('F.DIST.RT')?.implementedFunctions!['F.DIST.RT']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function CHIDIST', () => {
  it('should be an alias of CHISQ.DIST.RT', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('CHIDIST')?.implementedFunctions!['CHIDIST']
    const metadata2 = engine.getFunctionPlugin('CHISQ.DIST.RT')?.implementedFunctions!['CHISQ.DIST.RT']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function CHIINV', () => {
  it('should be an alias of CHISQ.INV.RT', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('CHIINV')?.implementedFunctions!['CHIINV']
    const metadata2 = engine.getFunctionPlugin('CHISQ.INV.RT')?.implementedFunctions!['CHISQ.INV.RT']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function GAMMADIST', () => {
  it('should be an alias of GAMMA.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('GAMMADIST')?.implementedFunctions!['GAMMADIST']
    const metadata2 = engine.getFunctionPlugin('GAMMA.DIST')?.implementedFunctions!['GAMMA.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function GAMMALN.PRECISE', () => {
  it('should be an alias of GAMMALN', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('GAMMALN.PRECISE')?.implementedFunctions!['GAMMALN.PRECISE']
    const metadata2 = engine.getFunctionPlugin('GAMMALN')?.implementedFunctions!['GAMMALN']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function GAMMAINV', () => {
  it('should be an alias of GAMMA.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('GAMMAINV')?.implementedFunctions!['GAMMAINV']
    const metadata2 = engine.getFunctionPlugin('GAMMA.INV')?.implementedFunctions!['GAMMA.INV']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function BETAINV', () => {
  it('should be an alias of BETA.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('BETAINV')?.implementedFunctions!['BETAINV']
    const metadata2 = engine.getFunctionPlugin('BETA.INV')?.implementedFunctions!['BETA.INV']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function BINOMDIST', () => {
  it('should be an alias of BINOM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('BINOMDIST')?.implementedFunctions!['BINOMDIST']
    const metadata2 = engine.getFunctionPlugin('BINOM.DIST')?.implementedFunctions!['BINOM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function STDEV', () => {
  it('should be an alias of STDEV.S', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('STDEV')?.implementedFunctions!['STDEV']
    const metadata2 = engine.getFunctionPlugin('STDEV.S')?.implementedFunctions!['STDEV.S']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function STDEVP', () => {
  it('should be an alias of STDEV.P', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('STDEVP')?.implementedFunctions!['STDEVP']
    const metadata2 = engine.getFunctionPlugin('STDEV.P')?.implementedFunctions!['STDEV.P']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function VARP', () => {
  it('should be an alias of VAR.P', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('VARP')?.implementedFunctions!['VARP']
    const metadata2 = engine.getFunctionPlugin('VAR.P')?.implementedFunctions!['VAR.P']
    expect(metadata1).toEqual(metadata2)
  })
})

describe('Function VAR', () => {
  it('should be an alias of VAR.S', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('VAR')?.implementedFunctions!['VAR']
    const metadata2 = engine.getFunctionPlugin('VAR.S')?.implementedFunctions!['VAR.S']
    expect(metadata1).toEqual(metadata2)
  })
})
