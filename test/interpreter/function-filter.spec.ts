import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FALSE', () => {
  it('validates input #1', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(A2:B3, A2:B3)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongDimension))
  })

  it('validates input #2', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(A2:A3, A2:A3, A2:A4)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EqualLength))
  })

  it('validates input #3', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(1, FALSE())']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EmptyRange))
  })

  it('works #1', () => {
    const engine = HyperFormula.buildFromArray([['=FILTER(A2:C2,A3:C3)'],[1,2,3],[true,false,true]])

    expect(engine.getSheetValues(0)).toEqual([[1,3],[1,2,3],[true,false,true]])
  })

  it('is 0-arity', () => {
    const engine = HyperFormula.buildFromArray([['=FALSE(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
})
