import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('COUNTBLANK', () => {
  it('with empty args', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COUNTBLANK()'],
      ['=COUNTBLANK(,)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
  })

  it('with args', async() => {
const engine = await HyperFormula.buildFromArray([['=COUNTBLANK(B1, C1)', '3.14']])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('with range', async() => {
const engine = await HyperFormula.buildFromArray([['1', null, null, '=COUNTBLANK(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
  })

  it('with empty strings', async() => {
const engine = await HyperFormula.buildFromArray([['', null, null, '=COUNTBLANK(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
  })

  it('does not propagate errors from ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      [null],
      ['=4/0'],
      ['=COUNTBLANK(A1:A2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('does not propagate errors from arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COUNTBLANK(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('works even when range vertex is in cycle', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['=COUNTBLANK(A1:A3)'],
      [null],
      ['=COUNTBLANK(A1:A3)']
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })
})
