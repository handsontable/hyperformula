import {HandsOnEngine} from '../src'
import {cellError, ErrorType} from '../src/Cell'

describe('Loading CSV', () => {
  it('with only strings', () => {
    const str = [
      `"Some header","Another header"`,
      `"Some simple string value","Bar"`,
    ].join('\n')

    const engine = HandsOnEngine.buildFromCsv(str)

    expect(engine.getCellValue('A1')).toBe('Some header')
    expect(engine.getCellValue('B1')).toBe('Another header')
    expect(engine.getCellValue('A2')).toBe('Some simple string value')
    expect(engine.getCellValue('B2')).toBe('Bar')
  })

  it('with some number', () => {
    const str = [
      `"Some header","Another header"`,
      `"Some simple string value",42`,
    ].join('\n')

    const engine = HandsOnEngine.buildFromCsv(str)

    expect(engine.getCellValue('B2')).toBe(42)
  })

  it('with some formula', () => {
    const str = [
      `"Some header","Another header"`,
      `"Some simple string value","=B1"`,
    ].join('\n')

    const engine = HandsOnEngine.buildFromCsv(str)

    expect(engine.getCellValue('B2')).toBe('Another header')
    expect(engine.getCellValue('A2')).toBe('Some simple string value')

  })
})
