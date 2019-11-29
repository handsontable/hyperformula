import {CsvImporter, EmptyValue} from '../../src'
import '../testConfig.ts'
import {adr} from '../testUtils'

describe('Loading CSV', () => {
  it('with only strings',  () => {
    const str = [
      `"Some header","Another header"`,
      `"Some simple string value","Bar"`,
    ].join('\n')

    const engine = new CsvImporter().importSheet(str)

    expect(engine.getCellValue(adr('A1'))).toBe('Some header')
    expect(engine.getCellValue(adr('B1'))).toBe('Another header')
    expect(engine.getCellValue(adr('A2'))).toBe('Some simple string value')
    expect(engine.getCellValue(adr('B2'))).toBe('Bar')
  })

  it('with some number',  () => {
    const str = [
      `"Some header","Another header"`,
      `"Some simple string value",42`,
    ].join('\n')

    const engine = new CsvImporter().importSheet(str)

    expect(engine.getCellValue(adr('B2'))).toBe(42)
  })

  it('with some formula',  () => {
    const str = [
      `"Some header","Another header"`,
      `"Some simple string value","=B1"`,
    ].join('\n')

    const engine = new CsvImporter().importSheet(str)

    expect(engine.getCellValue(adr('B2'))).toBe('Another header')
    expect(engine.getCellValue(adr('A2'))).toBe('Some simple string value')
  })

  it('should treat empty fields as EmptyValue', () => {
    const engine = new CsvImporter().importSheet("foo,,bar")

    expect(engine.getCellValue(adr("B1"))).toEqual(EmptyValue)
  })
})
