import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from './testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Ranges', () => {
  describe('when operating on infinite ranges', () => {
    describe('with array arithmetic on', () => {
      it('returns a cell error, when operation results in an infinite column range not starting on index 0 (setCellContents)', () => {
        const engine = HyperFormula.buildFromArray([[1, 2]], { useArrayArithmetic: true })
        engine.setCellContents(adr('B2'), '=A:A+B1')

        expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.ERROR, 'Invalid range size'))
      })

      it('returns a cell error, when operation results in a range with infinite width and infinite height (setCellContents)', () => {
        const engine = HyperFormula.buildFromArray([[1]], { useArrayArithmetic: true })
        engine.setCellContents(adr('B2'), '=A:A+1:1')

        expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.ERROR, 'Invalid range size'))
      })

      it('returns a #SPILL error, when operation results in an infinite column range not starting on index 0', () => {
        const engine = HyperFormula.buildFromArray([[1, 2], [null, '=A:A+B1']], { useArrayArithmetic: true })

        expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.SPILL, ErrorMessage.NoSpaceForArrayResult))
      })

      it('returns a #SPILL error, when operation results in a range with infinite width and infinite height', () => {
        const engine = HyperFormula.buildFromArray([[], [null, '=A:A+1:1']], { useArrayArithmetic: true })

        expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.SPILL, ErrorMessage.NoSpaceForArrayResult))
      })
    })

    describe('with array arithmetic off', () => {
      it('calculates the value according to the rules for array arithmetic mode disabled, when evaluating an operation on a column range and a single element (setCellContents)', () => {
        const engine = HyperFormula.buildFromArray([[1, 2], [3]], { useArrayArithmetic: false })
        engine.setCellContents(adr('B2'), '=A:A+B1')

        expect(engine.getSheetValues(0)).toEqual([[1, 2], [3, 5]])
      })

      it('calculates the value according to the rules for array arithmetic mode disabled, when evaluating an operation on a column range and a row range (setCellContents)', () => {
        const engine = HyperFormula.buildFromArray([[1, 2], [3]], { useArrayArithmetic: false })
        engine.setCellContents(adr('B2'), '=A:A+1:1')

        expect(engine.getSheetValues(0)).toEqual([[1, 2], [3, 5]])
      })

      it('returns a #SPILL error, when evaluating an operation on a column range and a single element', () => {
        const engine = HyperFormula.buildFromArray([[1, 2], [null, '=A:A+B1']], { useArrayArithmetic: true })

        expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.SPILL, ErrorMessage.NoSpaceForArrayResult))
      })

      it('returns a #SPILL error, when evaluating an operation on a column range and a row range', () => {
        const engine = HyperFormula.buildFromArray([[], [null, '=A:A+1:1']], { useArrayArithmetic: true })

        expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.SPILL, ErrorMessage.NoSpaceForArrayResult))
      })
    })
  })
})
