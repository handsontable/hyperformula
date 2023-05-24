import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function IFS', () => {
  it('Should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      [10, '=IFS()'],
      [20, '=IFS(A1>90)'],
      [30, '=IFS(A1>90, "A", A1>80)'],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('Nominal operation', () => {
    const engine = HyperFormula.buildFromArray([
      [11, '=IFS(A1>30, "A", A1>20, "B", A1>10, "C")'],
      [21, '=IFS(A2>30, "A", A2>20, "B", A2>10, "C")'],
      [31, '=IFS(A3>30, "A", A3>20, "B", A3>10, "C")'],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual('C')
    expect(engine.getCellValue(adr('B2'))).toEqual('B')
    expect(engine.getCellValue(adr('B3'))).toEqual('A')
  })

  it('Return first match', () => {
    const engine = HyperFormula.buildFromArray([
      [11, '=IFS(A1>10, "A", A1>10, "B", A1>10, "C")'],
      [21, '=IFS(A2>10, "A", A2>10, "B", A2>10, "C")'],
      [31, '=IFS(A3>10, "A", A3>10, "B", A3>10, "C")'],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual('A')
    expect(engine.getCellValue(adr('B2'))).toEqual('A')
    expect(engine.getCellValue(adr('B3'))).toEqual('A')
  })

  it('No match found', () => {
    const engine = HyperFormula.buildFromArray([
      [10, '=IFS(A1>90, "A", A1>80, "B", A1>70, "C")']
    ])
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.NoConditionMet))
  })
})
