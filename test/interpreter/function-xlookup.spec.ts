import {HyperFormula} from '../../src'
import {ErrorType} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function XLOOKUP', () => {
  describe('validates arguments', () => {
    it('returns error when less than 3 arguments', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:B3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    it('returns error when less more than 3 arguments', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:B3, C4:D5, "foo")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    // arg types validation

    it('returns error when lookupArray and returnArray are not of the same shape', () => {

    })

    it('propagates errors properly', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1/0, B1:B1, 1)'],
        ['=XLOOKUP(1, B1:B1, 1/0)'],
        ['=XLOOKUP(1, A10:A11, NA())']
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA))
    })
  })

  describe('looks up values', () => {
    // sorted column, NA if not found
    // sorted row, NA if not found
    // unsorted column, NA if not found
    // unsorted row, NA if not found
  })

  // different modes
})
