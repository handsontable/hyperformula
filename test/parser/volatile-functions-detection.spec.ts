import {buildConfig} from '../../src'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB} from '../../src/i18n'
import {
  CellAddress,
  ParserWithCaching,
} from '../../src/parser'

describe('ParserWithCaching - volatile functions detection', () => {
  it('detects volatile functions', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const result = parser.parse('=RAND()', CellAddress.absolute(0, 0, 0))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('detects volatile functions inside other functions', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const result = parser.parse('=SUM(RAND())', CellAddress.absolute(0, 0, 0))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('detects volatile functions in unary operators', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const result = parser.parse('=-RAND()', CellAddress.absolute(0, 0, 0))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('detects volatile functions in right arg of binary operators', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const result = parser.parse('=42+RAND()', CellAddress.absolute(0, 0, 0))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('detects volatile functions in left arg of binary operators', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const result = parser.parse('=RAND()+42', CellAddress.absolute(0, 0, 0))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('not all functions are volatile', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const result = parser.parse('=SUM()', CellAddress.absolute(0, 0, 0))
    expect(result.hasVolatileFunction).toBe(false)
  })
})

describe('ParserWithCaching - structural change functions detection', () => {
  it('detects volatile functions', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const result = parser.parse('=COLUMNS()', CellAddress.absolute(0, 0, 0))
    expect(result.hasStructuralChangeFunction).toBe(true)
  })

  it('not all functions are dependent on structure changes', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const result = parser.parse('=SUM()', CellAddress.absolute(0, 0, 0))
    expect(result.hasStructuralChangeFunction).toBe(false)
  })
})
