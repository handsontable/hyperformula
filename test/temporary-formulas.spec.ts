import {HyperFormula} from '../src'

describe('Temporary formulas - normalization', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([])

    const normalizedFormula = engine.normalizeFormula('=SHEET1!A1+10')

    expect(normalizedFormula).toEqual('=Sheet1!A1+10')
  })

  it('fail with a typo', async() => { 
    const engine = await HyperFormula.buildFromArray([])

    const normalizedFormula = engine.normalizeFormula('=SHET1!A1+10')
    const normalizedFormula2 = engine.normalizeFormula('=SUM(SHET1!A1:A100)')
   
    expect(normalizedFormula).toEqual('=SHET1!A1+10')
    expect(normalizedFormula2).toEqual('=SUM(SHET1!A1:A100)')
  })

  it('works with absolute addressing', async() => {
const engine = await HyperFormula.buildFromArray([])

    const normalizedFormula = engine.normalizeFormula('=3*$a$1')

    expect(normalizedFormula).toEqual('=3*$A$1')
  })

  it('wont normalize sheet names of not existing sheets', async() => {
const engine = await HyperFormula.buildEmpty()

    const formula = '=ShEeT1!A1+10'

    expect(engine.normalizeFormula(formula)).toBe('=ShEeT1!A1+10')
  })
})

describe('Temporary formulas - validation', () => {
  it('ok for formulas', async() => {
const engine = await HyperFormula.buildFromArray([])

    const formula = '=Sheet1!A1+10'

    expect(engine.validateFormula(formula)).toBe(true)
  })

  it('fail for simple values', async() => {
const engine = await HyperFormula.buildFromArray([])

    expect(engine.validateFormula('42')).toBe(false)
    expect(engine.validateFormula('some text')).toBe(false)
  })

  it('fail when not a formula', async() => {
const engine = await HyperFormula.buildFromArray([])

    expect(engine.validateFormula('=SOME SYNTAX ERRORS')).toBe(false)
  })

  it('ok when literal error', async() => {
const engine = await HyperFormula.buildFromArray([])

    expect(engine.validateFormula('=#N/A')).toBe(true)
  })

  it('validateFormula fails with an empty engine', async() => {
const engine = await HyperFormula.buildEmpty()

    const formula = '=Sheet1!A1+10'

    expect(engine.validateFormula(formula)).toBe(true)
  })
})

describe('Temporary formulas - calculation', () => {
  it('basic usage', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])

    const result = await engine.calculateFormula('=Sheet1!A1+10', 0)

    expect(result).toEqual(52)
  })

  it('formulas are executed in context of given sheet', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [['42']],
      Sheet2: [['58']],
    })

    expect(await engine.calculateFormula('=A1+10', 0)).toEqual(52)
    expect(await engine.calculateFormula('=A1+10', 1)).toEqual(68)
  })

  it('when sheet name does not exist', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
    ])

    await expect((async() => {
      await engine.calculateFormula('=Sheet1!A1+10', 1)
    })()).rejects.toThrowError(/no sheet with id/)
  })

  it('SUM with range args', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(await engine.calculateFormula('=SUM(A1:B2)', 0)).toEqual(10)
  })

  it('non-scalars work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2'],
    ])

    const result = await engine.calculateFormula('=TRANSPOSE(A1:B2)', 0)

    expect(result).toEqual([[1, 1], [2, 2]])
  })

  it('more non-scalars', async() => {
const engine = await HyperFormula.buildFromArray([[0, 1]])
    expect(await engine.calculateFormula('=ARRAYFORMULA(ISEVEN(A1:B2*3))', 0)).toEqual([[true, false], [true, true]])
  })

  it('passing something which is not a formula doesnt work', async() => {
const engine = await HyperFormula.buildFromArray([])

    await expect((async() => {
      await engine.calculateFormula('{=TRANSPOSE(A1:B2)}', 0)
    })()).rejects.toThrowError(/not a formula/)

    await expect((async() => {
      await engine.calculateFormula('42', 0)
    })()).rejects.toThrowError(/not a formula/)
  })
})
