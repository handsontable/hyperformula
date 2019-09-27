import {Config} from '../../src'
import {SheetMapping} from '../../src/DependencyGraph'
import {
  CellAddress,
  ParserWithCaching,
} from '../../src/parser'

describe('ParserWithCaching - caching', () => {
  it('it use cache for similar formulas', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const ast1 = parser.parse('=A1', CellAddress.absolute(0, 0, 0)).ast
    const ast2 = parser.parse('=A2', CellAddress.absolute(0, 0, 1)).ast

    expect(ast1).toEqual(ast2)
    expect(parser.statsCacheUsed).toBe(1)
  })

  it("doesn't count cache for different formulas", () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const bast1 = parser.parse('=A1', CellAddress.absolute(0, 0, 0)).ast
    const bast2 = parser.parse('=A2+A3', CellAddress.absolute(0, 0, 0)).ast

    expect(parser.statsCacheUsed).toBe(0)
  })
})
