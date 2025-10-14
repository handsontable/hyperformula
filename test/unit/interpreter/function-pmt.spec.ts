import {ErrorType, HyperFormula} from '../../../src'
import {CellValueDetailedType} from '../../../src/Cell'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function PMT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PMT(1,1)', '=PMT(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PMT(1%, 360, 10000)', '=PMT(1%, 360, 10000, 1000)', '=PMT(1%, 360, 10000, 1000, 1)'],
      ['=PMT(0, 360, 10000)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-102.86125969255)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-103.147385661805)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(-102.126124417629)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-27.777777777777)
  })

  it('should be possible to implement a mortgage calculator', () => {
    // Create a HyperFormula instance
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })

    // Add an empty sheet
    const sheetName = hf.addSheet('Mortgage Calculator')
    const sheetId = hf.getSheetId(sheetName)!

    // Enter the mortgage parameters
    hf.addNamedExpression('AnnualInterestRate', '8%')
    hf.addNamedExpression('NumberOfMonths', 10)
    hf.addNamedExpression('LoanAmount', 10000)

    // Use the PMT function to calculate the monthly payment
    hf.setCellContents({ sheet: sheetId, row: 0, col: 0 }, [['Monthly Payment', '=PMT(AnnualInterestRate/12, NumberOfMonths, -LoanAmount)']])

    // Display the result
    expect(hf.getCellValue({ sheet: sheetId, row: 0, col: 1 })).toBeCloseTo(1037.03)
  })
})
