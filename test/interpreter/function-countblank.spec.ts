import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('COUNTBLANK', () => {
  it('with empty args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNTBLANK()'],
      ['=COUNTBLANK(,)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
  })

  it('with args', () => {
    const [engine] = HyperFormula.buildFromArray([['=COUNTBLANK(B1, C1)', '3.14']])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('with range', () => {
    const [engine] = HyperFormula.buildFromArray([['1', null, null, '=COUNTBLANK(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
  })

  it('with empty strings', () => {
    const [engine] = HyperFormula.buildFromArray([['', null, null, '=COUNTBLANK(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
  })

  it('does not propagate errors from ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null],
      ['=4/0'],
      ['=COUNTBLANK(A1:A2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('does not propagate errors from arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COUNTBLANK(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('works even when range vertex is in cycle', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['=COUNTBLANK(A1:A3)'],
      [null],
      ['=COUNTBLANK(A1:A3)']
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })
})
