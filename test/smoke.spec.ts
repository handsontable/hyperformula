import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('HyperFormula', () => {
  it('should build engine from array and evaluate formulas', () => {
    const data = [
      [1, 2, 3],
      [4, 5, 6],
      ['=SUM(A1:C1)', '=SUM(A2:C2)', '=SUM(A1:C2)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('A3'))).toBe(6)
    expect(hf.getCellValue(adr('B3'))).toBe(15)
    expect(hf.getCellValue(adr('C3'))).toBe(21)
    expect(hf.getSheetDimensions(0)).toEqual({width: 3, height: 3})

    hf.destroy()
  })

  it('should evaluate arithmetic and logical formulas', () => {
    const data = [
      [10, 20, 30],
      ['=A1+B1+C1', '=A1*B1', '=C1/A1'],
      ['=IF(A1>5, "big", "small")', '=AND(A1>0, B1>0)', '=OR(A1<0, B1>0)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('A2'))).toBe(60)
    expect(hf.getCellValue(adr('B2'))).toBe(200)
    expect(hf.getCellValue(adr('C2'))).toBe(3)

    expect(hf.getCellValue(adr('A3'))).toBe('big')
    expect(hf.getCellValue(adr('B3'))).toBe(true)
    expect(hf.getCellValue(adr('C3'))).toBe(true)

    hf.destroy()
  })

  it('should handle common spreadsheet functions', () => {
    const data = [
      [1, 2, 3, 4, 5],
      ['=SUM(A1:E1)', '=AVERAGE(A1:E1)', '=MIN(A1:E1)', '=MAX(A1:E1)', '=COUNT(A1:E1)'],
      ['=CONCATENATE("Hello", " ", "World")', '=LEN("Test")', '=UPPER("hello")', '=LOWER("HELLO")', '=ABS(-5)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('A2'))).toBe(15)
    expect(hf.getCellValue(adr('B2'))).toBe(3)
    expect(hf.getCellValue(adr('C2'))).toBe(1)
    expect(hf.getCellValue(adr('D2'))).toBe(5)
    expect(hf.getCellValue(adr('E2'))).toBe(5)

    expect(hf.getCellValue(adr('A3'))).toBe('Hello World')
    expect(hf.getCellValue(adr('B3'))).toBe(4)
    expect(hf.getCellValue(adr('C3'))).toBe('HELLO')
    expect(hf.getCellValue(adr('D3'))).toBe('hello')
    expect(hf.getCellValue(adr('E3'))).toBe(5)

    hf.destroy()
  })

  it('should evaluate TEXTJOIN with ignore_empty=TRUE', () => {
    const data = [
      ['Hello', 'World', '', '=TEXTJOIN(", ", TRUE(), A1:C1)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('D1'))).toBe('Hello, World')

    hf.destroy()
  })

  it('should evaluate TEXTJOIN with ignore_empty=FALSE', () => {
    const data = [
      ['Hello', 'World', '', '=TEXTJOIN(", ", FALSE(), A1:C1)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('D1'))).toBe('Hello, World, ')

    hf.destroy()
  })

  it('should evaluate TEXTJOIN with individual cell references', () => {
    const data = [
      ['a', 'b', 'c', '=TEXTJOIN("-", TRUE(), A1, B1, C1)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('D1'))).toBe('a-b-c')

    hf.destroy()
  })

  it('should evaluate TEXTJOIN with single argument', () => {
    const data = [
      ['only', '=TEXTJOIN(",", TRUE(), A1)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('B1'))).toBe('only')

    hf.destroy()
  })

  it('should evaluate TEXTJOIN with empty delimiter', () => {
    const data = [
      ['x', 'y', 'z', '=TEXTJOIN("", TRUE(), A1:C1)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('D1'))).toBe('xyz')

    hf.destroy()
  })

  it('should evaluate TEXTJOIN with all-empty range and ignore_empty=TRUE', () => {
    const data = [
      ['', '', '', '=TEXTJOIN(",", TRUE(), A1:C1)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('D1'))).toBe('')

    hf.destroy()
  })

  it('should evaluate TEXTJOIN with all-empty range and ignore_empty=FALSE', () => {
    const data = [
      ['', '', '', '=TEXTJOIN(",", FALSE(), A1:C1)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('D1'))).toBe(',,')

    hf.destroy()
  })

  it('should add and remove rows with formula updates', () => {
    const data = [
      [1],
      [2],
      [3],
      ['=SUM(A1:A3)'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    expect(hf.getCellValue(adr('A4'))).toBe(6)

    hf.addRows(0, [1, 1])
    hf.setCellContents(adr('A2'), 10)

    expect(hf.getCellValue(adr('A5'))).toBe(16)

    hf.removeRows(0, [1, 1])

    expect(hf.getCellValue(adr('A4'))).toBe(6)

    hf.destroy()
  })
})
