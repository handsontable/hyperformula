import {simpleCellAddress} from '../src/Cell'
import {CellAddress} from '../src/CellAddress'
import {Config} from '../src/Config'
import {ParserWithCaching} from '../src/parser/ParserWithCaching'
import {SheetMapping} from '../src/SheetMapping'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'

describe('Parsing collecting dependencies', () => {
  it('works for CELL_REFERENCE with relative dependency', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const dependencies = parser.parse('=B2', CellAddress.absolute(0, 1, 1)).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(0, 1, 1),
    ])
  })

  it('works with absolute dependencies', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const dependencies = parser.parse('=$B$2', CellAddress.absolute(0, 1, 1)).dependencies

    expect(dependencies.length).toEqual(1)
    expect(dependencies[0]).toMatchObject(simpleCellAddress(0, 1, 1))
  })

  it('works for CELL_RANGE', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const dependencies = parser.parse('=B2:C4', CellAddress.absolute(0, 0, 0)).dependencies

    expect(dependencies).toEqual([
      new AbsoluteCellRange(simpleCellAddress(0, 1, 1), simpleCellAddress(0, 2, 3))
    ])
  })

  it('goes inside unary minus', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const dependencies = parser.parse('=-B2', CellAddress.absolute(0, 0, 0)).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(0, 1, 1),
    ])
  })

  it('goes inside plus operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const dependencies = parser.parse('=B2+C3', CellAddress.absolute(0, 0, 0)).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(0, 1, 1),
      simpleCellAddress(0, 2, 2),
    ])
  })

  it('goes inside function call arguments', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const dependencies = parser.parse('=SUM(B2, C3)', CellAddress.absolute(0, 0, 0)).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(0, 1, 1),
      simpleCellAddress(0, 2, 2),
    ])
  })

  it('OFFSET call is correctly found as dependency', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const dependencies = parser.parse('=OFFSET(D4, 0, 0)', CellAddress.absolute(0, 1, 1)).dependencies
    expect(dependencies).toEqual([
      simpleCellAddress(0, 3, 3),
    ])
  })

  it('COLUMNS arguments are not dependencies', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const dependencies = parser.parse('=COLUMNS(A1:B3)', CellAddress.absolute(0, 1, 1)).dependencies
    expect(dependencies).toEqual([])
  })
})
