import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SUMX2PY2', () => {
  it('should validate number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUMX2PY2(1)'],
      ['=SUMX2PY2(1,2,3)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return correct output', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUMX2PY2(A2:D2, A3:D3)'],
      [1, 2, 3, 4],
      [5, 4, 2, 1],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(76)
  })

  it('should validate that ranges are of equal length', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUMX2PY2(A2:F2, A3:E3)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.EqualLength))
  })

  it('should propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUMX2PY2(A2:E2, A3:E3)'],
      [1, 2, 3, '=NA()', 5, 6],
      [5, 4, 2, 1, 5, 10],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })

  it('should ignore non-number inputs', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUMX2PY2(A2:D2, A3:D3)'],
      [null, 2, '\'1', 4],
      [5, '\'abcd', 2, true],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })
})
