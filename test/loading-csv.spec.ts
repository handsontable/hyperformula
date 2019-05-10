import {HandsOnEngine} from '../src'
import {CellError, ErrorType} from '../src/Cell'
import './testConfig.ts'

describe('Loading CSV', () => {
  it('with only strings', async () => {
    const str = [
      `"Some header","Another header"`,
      `"Some simple string value","Bar"`,
    ].join('\n')

    const engine = await HandsOnEngine.buildFromCsv(str)

    expect(engine.getCellValue('A1')).toBe('Some header')
    expect(engine.getCellValue('B1')).toBe('Another header')
    expect(engine.getCellValue('A2')).toBe('Some simple string value')
    expect(engine.getCellValue('B2')).toBe('Bar')
  })

  it('with some number', async () => {
    const str = [
      `"Some header","Another header"`,
      `"Some simple string value",42`,
    ].join('\n')

    const engine = await HandsOnEngine.buildFromCsv(str)

    expect(engine.getCellValue('B2')).toBe(42)
  })

  it('with some formula', async () => {
    const str = [
      `"Some header","Another header"`,
      `"Some simple string value","=B1"`,
    ].join('\n')

    const engine = await HandsOnEngine.buildFromCsv(str)

    expect(engine.getCellValue('B2')).toBe('Another header')
    expect(engine.getCellValue('A2')).toBe('Some simple string value')

  })
})
