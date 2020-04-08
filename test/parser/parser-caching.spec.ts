import {simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage, enGB} from '../../src/i18n'
import {
  ParserWithCaching,
} from '../../src/parser'
import '../testConfig'

describe('ParserWithCaching - caching', () => {
  it('it use cache for similar formulas', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast1 = parser.parse('=A1', simpleCellAddress(0, 0, 0)).ast
    const ast2 = parser.parse('=A2', simpleCellAddress(0, 0, 1)).ast

    expect(ast1).toEqual(ast2)
    expect(parser.statsCacheUsed).toBe(1)
  })

  it("doesn't count cache for different formulas", () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    // eslint-disable-next-line
    const bast1 = parser.parse('=A1', simpleCellAddress(0, 0, 0)).ast
    // eslint-disable-next-line
    const bast2 = parser.parse('=A2+A3', simpleCellAddress(0, 0, 0)).ast

    expect(parser.statsCacheUsed).toBe(0)
  })
})
