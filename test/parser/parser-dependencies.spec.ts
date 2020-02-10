import {Config} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {absolutizeDependencies} from '../../src/absolutizeDependencies'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB} from '../../src/i18n'
import {ParserWithCaching} from '../../src/parser'
import {CellAddress} from '../../src/parser'
import {adr, detailedError} from '../testUtils'

describe('Parsing collecting dependencies', () => {
  it('works for CELL_REFERENCE with relative dependency', () => {
    const formulaAddress = CellAddress.absolute(0, 1, 1)
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const parseResult = parser.parse('=B2', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([adr('B2')])
  })

  it('works with absolute dependencies', () => {
    const formulaAddress = CellAddress.absolute(0, 1, 1)
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const parseResult = parser.parse('=$B$2', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies.length).toEqual(1)
    expect(dependencies[0]).toMatchObject(adr('B2'))
  })

  it('works for CELL_RANGE', () => {
    const formulaAddress = CellAddress.absolute(0, 0, 0)
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const parseResult = parser.parse('=B2:C4', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      new AbsoluteCellRange(adr('B2'), adr('C4')),
    ])
  })

  it('goes inside unary minus', () => {
    const formulaAddress = CellAddress.absolute(0, 0, 0)
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const parseResult = parser.parse('=-B2', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      adr('B2'),
    ])
  })

  it('goes inside plus operator', () => {
    const formulaAddress = CellAddress.absolute(0, 0, 0)
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const parseResult = parser.parse('=B2+C3', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      adr('B2'),
      adr('C3'),
    ])
  })

  it('goes inside function call arguments', () => {
    const formulaAddress = CellAddress.absolute(0, 0, 0)
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const parseResult = parser.parse('=SUM(B2, C3)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      adr('B2'),
      adr('C3'),
    ])
  })

  it('OFFSET call is correctly found as dependency', () => {
    const formulaAddress = CellAddress.absolute(0, 1, 1)
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const parseResult = parser.parse('=OFFSET(D4, 0, 0)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)
    expect(dependencies).toEqual([
      adr('D4'),
    ])
  })

  it('COLUMNS arguments are not dependencies', () => {
    const formulaAddress = CellAddress.absolute(0, 1, 1)
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const parseResult = parser.parse('=COLUMNS(A1:B3)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)
    expect(dependencies).toEqual([])
  })
})
