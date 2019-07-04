import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {simpleCellAddress} from '../src/Cell'
import {CellAddress} from '../src/parser/CellAddress'
import {Config} from '../src/Config'
import {ParserWithCaching} from '../src/parser'
import {SheetMapping} from '../src/DependencyGraph'

describe('Parsing collecting dependencies', () => {
  it('works for CELL_REFERENCE with relative dependency', () => {
    const formulaAddress = CellAddress.absolute(0, 1, 1)
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const parseResult = parser.parse('=B2', formulaAddress)
    const dependencies = parser.getAbsolutizedParserResult(parseResult.hash, formulaAddress).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(0, 1, 1),
    ])
  })

  it('works with absolute dependencies', () => {
    const formulaAddress = CellAddress.absolute(0, 1, 1)
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const parseResult = parser.parse('=$B$2', formulaAddress)
    const dependencies = parser.getAbsolutizedParserResult(parseResult.hash, formulaAddress).dependencies

    expect(dependencies.length).toEqual(1)
    expect(dependencies[0]).toMatchObject(simpleCellAddress(0, 1, 1))
  })

  it('works for CELL_RANGE', () => {
    const formulaAddress = CellAddress.absolute(0, 0, 0)
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const parseResult = parser.parse('=B2:C4', formulaAddress)
    const dependencies = parser.getAbsolutizedParserResult(parseResult.hash, formulaAddress).dependencies

    expect(dependencies).toEqual([
      new AbsoluteCellRange(simpleCellAddress(0, 1, 1), simpleCellAddress(0, 2, 3)),
    ])
  })

  it('goes inside unary minus', () => {
    const formulaAddress = CellAddress.absolute(0, 0, 0)
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const parseResult = parser.parse('=-B2', formulaAddress)
    const dependencies = parser.getAbsolutizedParserResult(parseResult.hash, formulaAddress).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(0, 1, 1),
    ])
  })

  it('goes inside plus operator', () => {
    const formulaAddress = CellAddress.absolute(0, 0, 0)
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const parseResult = parser.parse('=B2+C3', formulaAddress)
    const dependencies = parser.getAbsolutizedParserResult(parseResult.hash, formulaAddress).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(0, 1, 1),
      simpleCellAddress(0, 2, 2),
    ])
  })

  it('goes inside function call arguments', () => {
    const formulaAddress = CellAddress.absolute(0, 0, 0)
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const parseResult = parser.parse('=SUM(B2, C3)', formulaAddress)
    const dependencies = parser.getAbsolutizedParserResult(parseResult.hash, formulaAddress).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(0, 1, 1),
      simpleCellAddress(0, 2, 2),
    ])
  })

  it('OFFSET call is correctly found as dependency', () => {
    const formulaAddress = CellAddress.absolute(0, 1, 1)
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const parseResult = parser.parse('=OFFSET(D4, 0, 0)', formulaAddress)
    const dependencies = parser.getAbsolutizedParserResult(parseResult.hash, formulaAddress).dependencies
    expect(dependencies).toEqual([
      simpleCellAddress(0, 3, 3),
    ])
  })

  it('COLUMNS arguments are not dependencies', () => {
    const formulaAddress = CellAddress.absolute(0, 1, 1)
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const parseResult = parser.parse('=COLUMNS(A1:B3)', formulaAddress)
    const dependencies = parser.getAbsolutizedParserResult(parseResult.hash, formulaAddress).dependencies
    expect(dependencies).toEqual([])
  })
})
