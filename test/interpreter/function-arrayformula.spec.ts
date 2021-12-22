import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - function ARRAYFORMULA', () => {
  it('works #1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ARRAYFORMULA(1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('works #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ARRAYFORMULA(1/0)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('enables arrayformulas', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(ARRAYFORMULA(A2:C2+A2:C2))'],
      [1, 2, 3]
    ], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('A1'))).toEqual(12)
  })

  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ARRAYFORMULA()'],
      ['=ARRAYFORMULA(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
})
