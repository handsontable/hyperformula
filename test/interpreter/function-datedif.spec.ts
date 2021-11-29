import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DATEDIF', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF(1, 2, 3, 4)'],
      ['=DATEDIF(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for wrong type of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("foo", 1, "Y")'],
      ['=DATEDIF(2, "bar", "Y")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('numerical errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF(1, 2, "abcd")'],
      ['=DATEDIF(2, 1, "Y")'],
      ['=DATEDIF(1.9, 1.8, "Y")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.BadMode))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.StartEndDate))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.StartEndDate))
  })

  it('"D" mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("30/12/2018", "30/12/2018", "D")'],
      ['=DATEDIF("28/02/2019", "01/03/2019", "D")'],
      ['=DATEDIF("28/02/2020", "01/03/2020", "D")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })

  it('ignores time', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("22:00", "36:00", "D")'],
      ['=DATEDIF("28/02/2019", "01/03/2019 1:00am", "D")'],
      ['=DATEDIF("28/02/2020 2:00pm", "01/03/2020", "D")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })

  it('"M" mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("30/12/2018", "30/12/2019", "M")'],
      ['=DATEDIF("28/02/2019", "29/03/2019", "M")'],
      ['=DATEDIF("29/02/2020", "28/03/2020", "M")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('"YM" mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("30/12/2018", "30/12/2019", "YM")'],
      ['=DATEDIF("28/02/2019", "29/03/2019", "YM")'],
      ['=DATEDIF("29/02/2020", "28/03/2020", "YM")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('"Y" mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("01/03/2019", "29/02/2020", "Y")'],
      ['=DATEDIF("01/03/2019", "28/02/2020", "Y")'],
      ['=DATEDIF("28/02/2019", "29/02/2020", "Y")'],
      ['=DATEDIF("28/02/2019", "28/02/2020", "Y")'],
      ['=DATEDIF("29/02/2020", "28/02/2021", "Y")'],
      ['=DATEDIF("29/02/2020", "01/03/2021", "Y")'],
      ['=DATEDIF("28/02/2020", "28/02/2021", "Y")'],
      ['=DATEDIF("28/02/2020", "01/03/2021", "Y")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
    expect(engine.getCellValue(adr('A8'))).toEqual(1)
  })

  it('"MD" mode #1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2019", "29/02/2020", "MD")'],
      ['=DATEDIF("28/03/2019", "28/02/2020", "MD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('"MD" mode #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/05/2020", "MD")'],
      ['=DATEDIF("28/02/2016", "01/05/2020", "MD")'],
      ['=DATEDIF("28/02/2015", "01/05/2020", "MD")'],
      ['=DATEDIF("28/01/2016", "01/05/2020", "MD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('"MD" mode #3', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/03/2020", "MD")'],
      ['=DATEDIF("28/02/2016", "01/03/2020", "MD")'],
      ['=DATEDIF("28/02/2015", "01/03/2020", "MD")'],
      ['=DATEDIF("28/01/2016", "01/03/2020", "MD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(2)
  })

  it('"MD" mode #4', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/03/2021", "MD")'],
      ['=DATEDIF("28/02/2016", "01/03/2021", "MD")'],
      ['=DATEDIF("28/02/2015", "01/03/2021", "MD")'],
      ['=DATEDIF("28/01/2016", "01/03/2021", "MD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('"MD" mode #5', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/02/2020", "MD")'],
      ['=DATEDIF("28/02/2016", "01/02/2020", "MD")'],
      ['=DATEDIF("28/02/2015", "01/02/2020", "MD")'],
      ['=DATEDIF("28/01/2016", "01/02/2020", "MD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqual(4)
    expect(engine.getCellValue(adr('A3'))).toEqual(4)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('"MD" mode #6', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/01/2020", "MD")'],
      ['=DATEDIF("28/02/2016", "01/01/2020", "MD")'],
      ['=DATEDIF("28/02/2015", "01/01/2020", "MD")'],
      ['=DATEDIF("28/01/2016", "01/01/2020", "MD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqual(4)
    expect(engine.getCellValue(adr('A3'))).toEqual(4)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('"MD" mode negative result', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("31/01/2020", "01/03/2020", "MD")'],
      ['=DATEDIF("31/01/2021", "01/03/2021", "MD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-1)
    expect(engine.getCellValue(adr('A2'))).toEqual(-2)
  })

  it('"YD" mode #1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("27/02/2016", "27/02/2020", "YD")'],
      ['=DATEDIF("27/02/2016", "28/02/2020", "YD")'],
      ['=DATEDIF("27/02/2016", "29/02/2020", "YD")'],
      ['=DATEDIF("27/02/2016", "01/03/2020", "YD")'],
      ['=DATEDIF("27/02/2016", "27/02/2021", "YD")'],
      ['=DATEDIF("27/02/2016", "28/02/2021", "YD")'],
      ['=DATEDIF("27/02/2016", "01/03/2021", "YD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqual(2)
  })

  it('"YD" mode #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("28/02/2016", "27/02/2020", "YD")'],
      ['=DATEDIF("28/02/2016", "28/02/2020", "YD")'],
      ['=DATEDIF("28/02/2016", "29/02/2020", "YD")'],
      ['=DATEDIF("28/02/2016", "01/03/2020", "YD")'],
      ['=DATEDIF("28/02/2016", "27/02/2021", "YD")'],
      ['=DATEDIF("28/02/2016", "28/02/2021", "YD")'],
      ['=DATEDIF("28/02/2016", "01/03/2021", "YD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(365)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(2)
    expect(engine.getCellValue(adr('A5'))).toEqual(365)
    expect(engine.getCellValue(adr('A6'))).toEqual(0)
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
  })

  it('"YD" mode #3', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("29/02/2016", "27/02/2020", "YD")'],
      ['=DATEDIF("29/02/2016", "28/02/2020", "YD")'],
      ['=DATEDIF("29/02/2016", "29/02/2020", "YD")'],
      ['=DATEDIF("29/02/2016", "01/03/2020", "YD")'],
      ['=DATEDIF("29/02/2016", "27/02/2021", "YD")'],
      ['=DATEDIF("29/02/2016", "28/02/2021", "YD")'],
      ['=DATEDIF("29/02/2016", "01/03/2021", "YD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(364)
    expect(engine.getCellValue(adr('A2'))).toEqual(365)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
    expect(engine.getCellValue(adr('A5'))).toEqual(364)
    expect(engine.getCellValue(adr('A6'))).toEqual(365)
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
  })

  it('"YD" mode #4', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("01/03/2016", "27/02/2020", "YD")'],
      ['=DATEDIF("01/03/2016", "28/02/2020", "YD")'],
      ['=DATEDIF("01/03/2016", "29/02/2020", "YD")'],
      ['=DATEDIF("01/03/2016", "01/03/2020", "YD")'],
      ['=DATEDIF("01/03/2016", "27/02/2021", "YD")'],
      ['=DATEDIF("01/03/2016", "28/02/2021", "YD")'],
      ['=DATEDIF("01/03/2016", "01/03/2021", "YD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(363)
    expect(engine.getCellValue(adr('A2'))).toEqual(364)
    expect(engine.getCellValue(adr('A3'))).toEqual(365)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toEqual(363)
    expect(engine.getCellValue(adr('A6'))).toEqual(364)
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
  })

  it('"YD" mode #5', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("27/02/2015", "27/02/2020", "YD")'],
      ['=DATEDIF("27/02/2015", "28/02/2020", "YD")'],
      ['=DATEDIF("27/02/2015", "29/02/2020", "YD")'],
      ['=DATEDIF("27/02/2015", "01/03/2020", "YD")'],
      ['=DATEDIF("27/02/2015", "27/02/2021", "YD")'],
      ['=DATEDIF("27/02/2015", "28/02/2021", "YD")'],
      ['=DATEDIF("27/02/2015", "01/03/2021", "YD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqual(2)
  })

  it('"YD" mode #6', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("28/02/2015", "27/02/2020", "YD")'],
      ['=DATEDIF("28/02/2015", "28/02/2020", "YD")'],
      ['=DATEDIF("28/02/2015", "29/02/2020", "YD")'],
      ['=DATEDIF("28/02/2015", "01/03/2020", "YD")'],
      ['=DATEDIF("28/02/2015", "27/02/2021", "YD")'],
      ['=DATEDIF("28/02/2015", "28/02/2021", "YD")'],
      ['=DATEDIF("28/02/2015", "01/03/2021", "YD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(364)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(2)
    expect(engine.getCellValue(adr('A5'))).toEqual(364)
    expect(engine.getCellValue(adr('A6'))).toEqual(0)
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
  })

  it('"YD" mode #7', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF("01/03/2015", "27/02/2020", "YD")'],
      ['=DATEDIF("01/03/2015", "28/02/2020", "YD")'],
      ['=DATEDIF("01/03/2015", "29/02/2020", "YD")'],
      ['=DATEDIF("01/03/2015", "01/03/2020", "YD")'],
      ['=DATEDIF("01/03/2015", "27/02/2021", "YD")'],
      ['=DATEDIF("01/03/2015", "28/02/2021", "YD")'],
      ['=DATEDIF("01/03/2015", "01/03/2021", "YD")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(363)
    expect(engine.getCellValue(adr('A2'))).toEqual(364)
    expect(engine.getCellValue(adr('A3'))).toEqual(365)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toEqual(363)
    expect(engine.getCellValue(adr('A6'))).toEqual(364)
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
  })

  //inconsistency with product 1
  it('fails for negative values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATEDIF(-1, 0, "Y")'],
      ['=DATEDIF(0, -1, "M")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
