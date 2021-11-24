import {HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('string comparison', () => {
  it('comparison default', async() => {
const engine = await HyperFormula.buildFromArray([
      ['a', 'A', '=A1>B1'],
      ['aa', 'AA', '=A2>B2'],
      ['aA', 'aa', '=A3>B3'],
      ['Aa', 'aa', '=A4>B4'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('C2'))).toBe(false)
    expect(engine.getCellValue(adr('C3'))).toBe(false)
    expect(engine.getCellValue(adr('C4'))).toBe(false)
  })

  it('accents default', async() => {
const engine = await HyperFormula.buildFromArray([
      ['a', 'ä', '=A1>B1'],
      ['áá', 'ää', '=A2>B2'],
      ['ää', 'ĄĄ', '=A3>B3'],
      ['ää', 'ZZ', '=A4>B4'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('C2'))).toBe(false)
    expect(engine.getCellValue(adr('C3'))).toBe(false)
    expect(engine.getCellValue(adr('C4'))).toBe(false)
  })

  it('accents sensitive', async() => {
const engine = await HyperFormula.buildFromArray([
      ['Ą', 'ą', '=A1>B1'],
      ['ää', 'áá', '=A2>B2'],
      ['ää', 'ĄĄ', '=A3>B3'],
      ['ää', 'ŹŹ', '=A4>B4'],
    ], {accentSensitive: true})

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('C2'))).toBe(true)
    expect(engine.getCellValue(adr('C3'))).toBe(false)
    expect(engine.getCellValue(adr('C4'))).toBe(false)
  })

  it('accents+case sensitive', async() => {
const engine = await HyperFormula.buildFromArray([
      ['Ą', 'ą', '=A1>B1'],
      ['áá', 'ää', '=A2>B2'],
      ['ää', 'ĄĄ', '=A3>B3'],
      ['ää', 'ŹŹ', '=A4>B4'],
    ], {accentSensitive: true, caseSensitive: true})

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('C2'))).toBe(false)
    expect(engine.getCellValue(adr('C3'))).toBe(false)
    expect(engine.getCellValue(adr('C4'))).toBe(false)
  })

  it('accents+case sensitive, reverse order', async() => {
const engine = await HyperFormula.buildFromArray([
      ['Ą', 'ą', '=A1>B1'],
      ['áá', 'ää', '=A2>B2'],
      ['ää', 'ĄĄ', '=A3>B3'],
      ['ää', 'ŹŹ', '=A4>B4'],
    ], {accentSensitive: true, caseSensitive: true, caseFirst: 'upper'})

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('C2'))).toBe(false)
    expect(engine.getCellValue(adr('C3'))).toBe(false)
    expect(engine.getCellValue(adr('C4'))).toBe(false)
  })

  it('accents lang', async() => {
const engine = await HyperFormula.buildFromArray([
      ['a', 'ä', '=A1>B1'],
      ['aa', 'ää', '=A2>B2'],
      ['ää', 'ĄĄ', '=A3>B3'],
      ['ää', 'ZZ', '=A4>B4'],
    ], {localeLang: 'sv', accentSensitive: true})

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('C2'))).toBe(false)
    expect(engine.getCellValue(adr('C3'))).toBe(true)
    expect(engine.getCellValue(adr('C4'))).toBe(true)
  })


  it('comparison case sensitive', async() => {
const engine = await HyperFormula.buildFromArray([
      ['ą', 'A', '=A1>B1'],
      ['aa', 'AA', '=A2>B2'],
      ['aA', 'aa', '=A3>B3'],
      ['Aa', 'aa', '=A4>B4'],
    ], {caseSensitive: true})

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('C2'))).toBe(false)
    expect(engine.getCellValue(adr('C3'))).toBe(true)
    expect(engine.getCellValue(adr('C4'))).toBe(true)
  })

  it('comparison case sensitive, reverse order', async() => {
const engine = await HyperFormula.buildFromArray([
      ['ą', 'A', '=A1>B1'],
      ['aa', 'AA', '=A2>B2'],
      ['aA', 'aa', '=A3>B3'],
      ['Aa', 'aa', '=A4>B4'],
    ], {caseSensitive: true, caseFirst: 'upper'})

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('C2'))).toBe(true)
    expect(engine.getCellValue(adr('C3'))).toBe(false)
    expect(engine.getCellValue(adr('C4'))).toBe(false)
  })

  it('comparison ignore punctuation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['a', 'A,A,A', '=A1>B1'],
      ['aa', '...AA', '=A2>B2'],
      ['aA', ';;;;aa', '=A3>B3'],
      ['Aa', '????aa', '=A4>B4'],
    ], {ignorePunctuation: true})

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('C2'))).toBe(false)
    expect(engine.getCellValue(adr('C3'))).toBe(false)
    expect(engine.getCellValue(adr('C4'))).toBe(false)
  })
})
