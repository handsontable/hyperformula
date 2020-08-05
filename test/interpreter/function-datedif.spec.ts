import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function DATEDIF', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF(1, 2, 3, 4)'],
      ['=DATEDIF(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should not work for wrong type of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("foo", 1, "y")'],
      ['=DATEDIF(2, "bar", "y")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('numerical errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF(1, 2, "abcd")'],
      ['=DATEDIF(2, 1, "y")'],
      ['=DATEDIF(1.9, 1.8, "y")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('"d" mode', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("30/12/2018", "30/12/2018", "d")'],
      ['=DATEDIF("28/02/2019", "01/03/2019", "d")'],
      ['=DATEDIF("28/02/2020", "01/03/2020", "d")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })

  it('ignores time', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("22:00", "36:00", "d")'],
      ['=DATEDIF("28/02/2019", "01/03/2019 1:00am", "d")'],
      ['=DATEDIF("28/02/2020 2:00pm", "01/03/2020", "d")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })

  it('"m" mode', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("30/12/2018", "30/12/2019", "m")'],
      ['=DATEDIF("28/02/2019", "29/03/2019", "m")'],
      ['=DATEDIF("29/02/2020", "28/03/2020", "m")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('"ym" mode', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("30/12/2018", "30/12/2019", "ym")'],
      ['=DATEDIF("28/02/2019", "29/03/2019", "ym")'],
      ['=DATEDIF("29/02/2020", "28/03/2020", "ym")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('"y" mode', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("01/03/2019", "29/02/2020", "y")'],
      ['=DATEDIF("01/03/2019", "28/02/2020", "y")'],
      ['=DATEDIF("28/02/2019", "29/02/2020", "y")'],
      ['=DATEDIF("28/02/2019", "28/02/2020", "y")'],
      ['=DATEDIF("29/02/2020", "28/02/2021", "y")'],
      ['=DATEDIF("29/02/2020", "01/03/2021", "y")'],
      ['=DATEDIF("28/02/2020", "28/02/2021", "y")'],
      ['=DATEDIF("28/02/2020", "01/03/2021", "y")'],
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

  it('"md" mode #1', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2019", "29/02/2020", "md")'],
      ['=DATEDIF("28/03/2019", "28/02/2020", "md")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('"md" mode #2', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/05/2020", "md")'],
      ['=DATEDIF("28/02/2016", "01/05/2020", "md")'],
      ['=DATEDIF("28/02/2015", "01/05/2020", "md")'],
      ['=DATEDIF("28/01/2016", "01/05/2020", "md")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('"md" mode #3', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/03/2020", "md")'],
      ['=DATEDIF("28/02/2016", "01/03/2020", "md")'],
      ['=DATEDIF("28/02/2015", "01/03/2020", "md")'],
      ['=DATEDIF("28/01/2016", "01/03/2020", "md")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(2)
  })

  it('"md" mode #4', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/03/2021", "md")'],
      ['=DATEDIF("28/02/2016", "01/03/2021", "md")'],
      ['=DATEDIF("28/02/2015", "01/03/2021", "md")'],
      ['=DATEDIF("28/01/2016", "01/03/2021", "md")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
  })

  it('"md" mode #5', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/02/2020", "md")'],
      ['=DATEDIF("28/02/2016", "01/02/2020", "md")'],
      ['=DATEDIF("28/02/2015", "01/02/2020", "md")'],
      ['=DATEDIF("28/01/2016", "01/02/2020", "md")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqual(4)
    expect(engine.getCellValue(adr('A3'))).toEqual(4)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('"md" mode #6', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("28/03/2016", "01/01/2020", "md")'],
      ['=DATEDIF("28/02/2016", "01/01/2020", "md")'],
      ['=DATEDIF("28/02/2015", "01/01/2020", "md")'],
      ['=DATEDIF("28/01/2016", "01/01/2020", "md")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqual(4)
    expect(engine.getCellValue(adr('A3'))).toEqual(4)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('"yd" mode #1', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("27/02/2016", "27/02/2020", "yd")'],
      ['=DATEDIF("27/02/2016", "28/02/2020", "yd")'],
      ['=DATEDIF("27/02/2016", "29/02/2020", "yd")'],
      ['=DATEDIF("27/02/2016", "01/03/2020", "yd")'],
      ['=DATEDIF("27/02/2016", "27/02/2021", "yd")'],
      ['=DATEDIF("27/02/2016", "28/02/2021", "yd")'],
      ['=DATEDIF("27/02/2016", "01/03/2021", "yd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqual(2)
  })

  it('"yd" mode #2', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("28/02/2016", "27/02/2020", "yd")'],
      ['=DATEDIF("28/02/2016", "28/02/2020", "yd")'],
      ['=DATEDIF("28/02/2016", "29/02/2020", "yd")'],
      ['=DATEDIF("28/02/2016", "01/03/2020", "yd")'],
      ['=DATEDIF("28/02/2016", "27/02/2021", "yd")'],
      ['=DATEDIF("28/02/2016", "28/02/2021", "yd")'],
      ['=DATEDIF("28/02/2016", "01/03/2021", "yd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(365)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(2)
    expect(engine.getCellValue(adr('A5'))).toEqual(365)
    expect(engine.getCellValue(adr('A6'))).toEqual(0)
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
  })

  it('"yd" mode #3', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("29/02/2016", "27/02/2020", "yd")'],
      ['=DATEDIF("29/02/2016", "28/02/2020", "yd")'],
      ['=DATEDIF("29/02/2016", "29/02/2020", "yd")'],
      ['=DATEDIF("29/02/2016", "01/03/2020", "yd")'],
      ['=DATEDIF("29/02/2016", "27/02/2021", "yd")'],
      ['=DATEDIF("29/02/2016", "28/02/2021", "yd")'],
      ['=DATEDIF("29/02/2016", "01/03/2021", "yd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(364)
    expect(engine.getCellValue(adr('A2'))).toEqual(365)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
    expect(engine.getCellValue(adr('A5'))).toEqual(364)
    expect(engine.getCellValue(adr('A6'))).toEqual(365)
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
  })

  it('"yd" mode #4', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("01/03/2016", "27/02/2020", "yd")'],
      ['=DATEDIF("01/03/2016", "28/02/2020", "yd")'],
      ['=DATEDIF("01/03/2016", "29/02/2020", "yd")'],
      ['=DATEDIF("01/03/2016", "01/03/2020", "yd")'],
      ['=DATEDIF("01/03/2016", "27/02/2021", "yd")'],
      ['=DATEDIF("01/03/2016", "28/02/2021", "yd")'],
      ['=DATEDIF("01/03/2016", "01/03/2021", "yd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(363)
    expect(engine.getCellValue(adr('A2'))).toEqual(364)
    expect(engine.getCellValue(adr('A3'))).toEqual(365)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toEqual(363)
    expect(engine.getCellValue(adr('A6'))).toEqual(364)
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
  })

  it('"yd" mode #5', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("27/02/2015", "27/02/2020", "yd")'],
      ['=DATEDIF("27/02/2015", "28/02/2020", "yd")'],
      ['=DATEDIF("27/02/2015", "29/02/2020", "yd")'],
      ['=DATEDIF("27/02/2015", "01/03/2020", "yd")'],
      ['=DATEDIF("27/02/2015", "27/02/2021", "yd")'],
      ['=DATEDIF("27/02/2015", "28/02/2021", "yd")'],
      ['=DATEDIF("27/02/2015", "01/03/2021", "yd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqual(2)
  })

  it('"yd" mode #6', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("28/02/2015", "27/02/2020", "yd")'],
      ['=DATEDIF("28/02/2015", "28/02/2020", "yd")'],
      ['=DATEDIF("28/02/2015", "29/02/2020", "yd")'],
      ['=DATEDIF("28/02/2015", "01/03/2020", "yd")'],
      ['=DATEDIF("28/02/2015", "27/02/2021", "yd")'],
      ['=DATEDIF("28/02/2015", "28/02/2021", "yd")'],
      ['=DATEDIF("28/02/2015", "01/03/2021", "yd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(364)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(2)
    expect(engine.getCellValue(adr('A5'))).toEqual(364)
    expect(engine.getCellValue(adr('A6'))).toEqual(0)
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
  })

  it('"yd" mode #7', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATEDIF("01/03/2015", "27/02/2020", "yd")'],
      ['=DATEDIF("01/03/2015", "28/02/2020", "yd")'],
      ['=DATEDIF("01/03/2015", "29/02/2020", "yd")'],
      ['=DATEDIF("01/03/2015", "01/03/2020", "yd")'],
      ['=DATEDIF("01/03/2015", "27/02/2021", "yd")'],
      ['=DATEDIF("01/03/2015", "28/02/2021", "yd")'],
      ['=DATEDIF("01/03/2015", "01/03/2021", "yd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(363)
    expect(engine.getCellValue(adr('A2'))).toEqual(364)
    expect(engine.getCellValue(adr('A3'))).toEqual(365)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toEqual(363)
    expect(engine.getCellValue(adr('A6'))).toEqual(364)
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
  })
})
