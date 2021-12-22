import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SHEET', () => {
  it('should return formula sheet number', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Sheet1': [['=SHEET()']],
      'Sheet2': [['=SHEET()']],
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A1', 1))).toEqual(2)
  })

  it('should return reference sheet number for self sheet reference', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Sheet1': [['=SHEET(B1)']],
      'Sheet2': [['=SHEET(B1)', '=1/0']],
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A1', 1))).toEqual(2)
  })

  it('should return reference sheet number for absolute sheet reference', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Sheet1': [['=SHEET(Sheet1!B1)', '=SHEET(Sheet2!B1)']],
      'Sheet2': [['=SHEET(Sheet1!B1)', '=SHEET(Sheet2!B2)']],
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('A1', 1))).toEqual(1)
    expect(engine.getCellValue(adr('B1', 1))).toEqual(2)
  })

  it('should return range sheet number', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Sheet1': [['=SHEET(B1:B2)', '=SHEET(Sheet2!A1:B1)']],
      'Sheet2': [['=SHEET(B1:B2)', '=SHEET(Sheet1!A1:B1)']],
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('A1', 1))).toEqual(2)
    expect(engine.getCellValue(adr('B1', 1))).toEqual(1)
  })

  it('should return VALUE for non existing sheet', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Sheet1': [['=SHEET("FOO")', '=SHEET(1)']],
    })

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.SheetRef))
  })

  it('should coerce', () => {
    const [engine] = HyperFormula.buildFromArray([])
    engine.addSheet('TRUE')
    engine.addSheet('1')

    engine.setCellContents(adr('A1'), [['=SHEET(1=1)']])
    engine.setCellContents(adr('B1'), [['=SHEET(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
  })

  it('should propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([['=SHEET(1/0)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should work for itself', () => {
    const [engine] = HyperFormula.buildFromArray([['=SHEET(A1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('should make cycle for non-refs', () => {
    const [engine] = HyperFormula.buildFromArray([['=SHEET(1+A1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
  })
})
