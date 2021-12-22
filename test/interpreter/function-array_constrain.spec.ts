import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - function ARRAY_CONSTRAIN', () => {
  it('works #1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ARRAY_CONSTRAIN(1, 1, 1)'],
    ])
    expect(engine.getSheetValues(0)).toEqual([[1]])
  })

  it('works #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ARRAY_CONSTRAIN(1, 2, 2)'],
    ])
    expect(engine.getSheetValues(0)).toEqual([[1]])
  })

  it('validates args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ARRAY_CONSTRAIN(1, 0, 1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('works #3', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=ARRAY_CONSTRAIN(Sheet2!A1:C3, 2, 2)'],
      ],
      Sheet2: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]
    })
    expect(engine.getSheetValues(0)).toEqual([[1, 2], [4, 5]])
  })

  it('works #4', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=ARRAY_CONSTRAIN(Sheet2!A1:C3, 2, 4)'],
      ],
      Sheet2: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]
    })
    expect(engine.getSheetValues(0)).toEqual([[1, 2, 3], [4, 5, 6]])
  })

  it('validates number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ARRAY_CONSTRAIN(1, 2)'],
      ['=ARRAY_CONSTRAIN(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
})
