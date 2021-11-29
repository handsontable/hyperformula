import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ISBLANK', () => {
  it('should return true for references to empty cells', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, '=ISBLANK(A1)', '=ISBLANK(A2)'],
      ['=A1'],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
  })

  it('should return false for empty string', () => {
    const [engine] = HyperFormula.buildFromArray([['', '=ISBLANK(A1)']])
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
  })

  it('should return false if it is not reference to empty cell', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, '=ISBLANK("")', '=ISBLANK(4)', '=ISBLANK(CONCATENATE(A1,A1))'],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(false)
  })

  it('takes exactly one argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISBLANK(A3, A2)', '=ISBLANK()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('no error propagation', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISBLANK(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('range value results in VALUE error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0'],
      [null],
      [null],
      ['=ISBLANK(A1:A3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
