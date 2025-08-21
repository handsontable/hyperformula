import {Config} from '../../src/Config'
import {adr} from '../testUtils'
import {buildEmptyParserWithCaching} from './common'

describe('ParserWithCaching - caching', () => {
  it('it use cache for similar formulas', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast1 = parser.parse('=A1', adr('A1')).ast
    const ast2 = parser.parse('=A2', adr('A2')).ast

    expect(ast1).toEqual(ast2)
    expect(parser.statsCacheUsed).toBe(1)
  })

  it("doesn't count cache for different formulas", () => {
    const parser = buildEmptyParserWithCaching(new Config())

    parser.parse('=A1', adr('A1')).ast
    parser.parse('=A2+A3', adr('A1')).ast

    expect(parser.statsCacheUsed).toBe(0)
  })
})
