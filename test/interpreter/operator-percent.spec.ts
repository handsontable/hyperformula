import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Percent operator', () => {
  it('works for obvious case', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=3%'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0.03)
  })

  it('use number coerce', async() => {
const engine = await HyperFormula.buildFromArray([
      ['="3"%'],
      ['="foobar"%'],
      ['=TRUE()%'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0.03)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqual(0.01)
  })

  it('pass reference', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=A2%'],
      ['=42'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.42)
  })

  it('pass error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=A2%'],
      ['=FOOBAR()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
  })

  it('works with other operator and coercion', async() => {
const engine = await HyperFormula.buildFromArray([['=TRUE()%*1']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.01)
  })

  it('range value results in VALUE error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['9'],
      ['3'],
      ['=A1:A3%'],
    ], {useArrayArithmetic: false})

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })
})
