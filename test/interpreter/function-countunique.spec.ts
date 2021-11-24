import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COUNTUNIQUE', () => {
  it('error when no arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COUNTUNIQUE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('single number', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COUNTUNIQUE(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('three numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COUNTUNIQUE(2, 1, 2)'],
      ['=COUNTUNIQUE(2, 1, 1)'],
      ['=COUNTUNIQUE(2, 1, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })

  it('theres no coercion', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '="1"'],
      ['=COUNTUNIQUE(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(2)
  })

  it('errors in arguments are not propagated', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COUNTUNIQUE(5/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('different errors are counted by type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=4/0', '=COUNTUNIQUE(A1:A4)'],
      ['=FOOBAR()'],
      ['=5/0'],
      ['=BARFOO()'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(2)
  })

  it('empty string doesnt count', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=""', '=COUNTUNIQUE("", A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('different strings are recognized are counted by type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['foo', '=COUNTUNIQUE(A1:A4)'],
      ['bar'],
      ['foo'],
      ['bar '],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(3)
  })

  it('singular values are counted', async() => {
const engine = await HyperFormula.buildFromArray([
      ['TRUE()', '=COUNTUNIQUE(A1:A6)'],
      ['FALSE()'],
      [null],
      ['TRUE()'],
      ['FALSE()'],
      [null],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(3)
  })
})
