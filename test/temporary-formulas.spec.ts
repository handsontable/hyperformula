import {HyperFormula} from '../src'

describe('Temporary formulas - normalization', () => {
  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([])

    const normalizedFormula = engine.normalizeFormula('=SHEET1!A1+10')

    expect(normalizedFormula).toEqual('=Sheet1!A1+10')
  })

  it('fail with a typo', () => {
    const [engine] = HyperFormula.buildFromArray([])

    const normalizedFormula = engine.normalizeFormula('=SHET1!A1+10')
    const normalizedFormula2 = engine.normalizeFormula('=SUM(SHET1!A1:A100)')

    expect(normalizedFormula).toEqual('=SHET1!A1+10')
    expect(normalizedFormula2).toEqual('=SUM(SHET1!A1:A100)')
  })

  it('works with absolute addressing', () => {
    const [engine] = HyperFormula.buildFromArray([])

    const normalizedFormula = engine.normalizeFormula('=3*$a$1')

    expect(normalizedFormula).toEqual('=3*$A$1')
  })

  it('wont normalize sheet names of not existing sheets', () => {
    const [engine] = HyperFormula.buildEmpty()

    const formula = '=ShEeT1!A1+10'

    expect(engine.normalizeFormula(formula)).toBe('=ShEeT1!A1+10')
  })
})

describe('Temporary formulas - validation', () => {
  it('ok for formulas', () => {
    const [engine] = HyperFormula.buildFromArray([])

    const formula = '=Sheet1!A1+10'

    expect(engine.validateFormula(formula)).toBe(true)
  })

  it('fail for simple values', () => {
    const [engine] = HyperFormula.buildFromArray([])

    expect(engine.validateFormula('42')).toBe(false)
    expect(engine.validateFormula('some text')).toBe(false)
  })

  it('fail when not a formula', () => {
    const [engine] = HyperFormula.buildFromArray([])

    expect(engine.validateFormula('=SOME SYNTAX ERRORS')).toBe(false)
  })

  it('ok when literal error', () => {
    const [engine] = HyperFormula.buildFromArray([])

    expect(engine.validateFormula('=#N/A')).toBe(true)
  })

  it('validateFormula fails with an empty engine', () => {
    const [engine] = HyperFormula.buildEmpty()

    const formula = '=Sheet1!A1+10'

    expect(engine.validateFormula(formula)).toBe(true)
  })
})

describe('Temporary formulas - calculation', () => {
  it('basic usage', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['42'],
    ])

    const [result] = engine.calculateFormula('=Sheet1!A1+10', 0)

    expect(result).toEqual(52)
  })

  it('formulas are executed in context of given sheet', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [['42']],
      Sheet2: [['58']],
    })

    expect(engine.calculateFormula('=A1+10', 0)[0]).toEqual(52)
    expect(engine.calculateFormula('=A1+10', 1)[0]).toEqual(68)
  })

  it('when sheet name does not exist', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['42'],
    ])

    expect(() => {
      engine.calculateFormula('=Sheet1!A1+10', 1)
    }).toThrowError(/no sheet with id/)
  })

  it('SUM with range args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(engine.calculateFormula('=SUM(A1:B2)', 0)[0]).toEqual(10)
  })

  it('non-scalars work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2'],
    ])

    const [result] = engine.calculateFormula('=TRANSPOSE(A1:B2)', 0)

    expect(result).toEqual([[1, 1], [2, 2]])
  })

  it('more non-scalars', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 1]])
    expect(engine.calculateFormula('=ARRAYFORMULA(ISEVEN(A1:B2*3))', 0)[0]).toEqual([[true, false], [true, true]])
  })

  it('passing something which is not a formula doesnt work', () => {
    const [engine] = HyperFormula.buildFromArray([])

    expect(() => {
      engine.calculateFormula('{=TRANSPOSE(A1:B2)}', 0)
    }).toThrowError(/not a formula/)

    expect(() => {
      engine.calculateFormula('42', 0)
    }).toThrowError(/not a formula/)
  })
})
