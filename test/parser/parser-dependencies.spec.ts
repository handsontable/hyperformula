import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {absolutizeDependencies} from '../../src/absolutizeDependencies'
import {simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage, enGB} from '../../src/i18n'
import {ParserWithCaching, NamedExpressionDependency} from '../../src/parser'
import {adr, expectArrayWithSameContent} from '../testUtils'

describe('Parsing collecting dependencies', () => {
  it('works for CELL_REFERENCE with relative dependency', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const formulaAddress = simpleCellAddress(0, 1, 1)

    const parseResult = parser.parse('=B2', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([adr('B2')])
  })

  it('works with absolute dependencies', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const formulaAddress = simpleCellAddress(0, 1, 1)

    const parseResult = parser.parse('=$B$2', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies.length).toEqual(1)
    expect(dependencies[0]).toEqual(adr('B2'))
  })

  it('works for CELL_RANGE', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const formulaAddress = simpleCellAddress(0, 0, 0)

    const parseResult = parser.parse('=B2:C4', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      new AbsoluteCellRange(adr('B2'), adr('C4')),
    ])
  })

  it('works inside parenthesis', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const formulaAddress = simpleCellAddress(0, 0, 0)

    const parseResult = parser.parse('=(A1+B2)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expectArrayWithSameContent([adr('A1'), adr('B2')], dependencies)
  })

  it('goes inside unary minus', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const formulaAddress = simpleCellAddress(0, 0, 0)

    const parseResult = parser.parse('=-B2', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      adr('B2'),
    ])
  })

  it('goes inside plus operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const formulaAddress = simpleCellAddress(0, 0, 0)

    const parseResult = parser.parse('=B2+C3', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      adr('B2'),
      adr('C3'),
    ])
  })

  it('goes inside function call arguments', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const formulaAddress = simpleCellAddress(0, 0, 0)

    const parseResult = parser.parse('=SUM(B2, C3)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      adr('B2'),
      adr('C3'),
    ])
  })

  it('OFFSET call is correctly found as dependency', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const formulaAddress = simpleCellAddress(0, 1, 1)

    const parseResult = parser.parse('=OFFSET(D4, 0, 0)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)
    expect(dependencies).toEqual([
      adr('D4'),
    ])
  })

  it('COLUMNS arguments are not dependencies', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const formulaAddress = simpleCellAddress(0, 1, 1)

    const parseResult = parser.parse('=COLUMNS(A1:B3)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)
    expect(dependencies).toEqual([])
  })

  it('works for named expression dependencies', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const parseResult = parser.parse('=FOO+bar', adr('A1'))

    const dependencies = absolutizeDependencies(parseResult.dependencies, adr('A1'))

    expect(dependencies).toEqual([
      new NamedExpressionDependency('foo'),
      new NamedExpressionDependency('bar'),
    ])
  })
})
