import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Unary operator PLUS', () => {
  it('works for obvious case', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=+3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3)
  })

  it('use number coerce', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=+"3"'],
      ['=+"foobar"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('3')
    expect(engine.getCellValue(adr('A2'))).toEqual('foobar')
  })

  it('pass error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=+B1', '=FOOBAR()'],
      ['=+B2', '=1/0'],

    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('range value results in VALUE error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['9'],
      ['3'],
      ['=+A1:A3'],
    ], {useArrayArithmetic: false})

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('string given by reference should return string with UNARY+', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['Liz'],
      ['=+A1']
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual('Liz') // UNARY PLUS value
  })

  it('double unary plus', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=++2'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })
})
