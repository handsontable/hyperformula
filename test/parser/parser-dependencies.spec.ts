import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {absolutizeDependencies} from '../../src/absolutizeDependencies'
import {simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {adr} from '../testUtils'
import {buildEmptyParserWithCaching} from './common'

describe('Parsing collecting dependencies', () => {
  it('works for CELL_REFERENCE with relative dependency', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const formulaAddress = simpleCellAddress(0, 1, 1)

    const parseResult = parser.parse('=B2', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([adr('B2')])
  })

  it('works with absolute dependencies', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const formulaAddress = simpleCellAddress(0, 1, 1)

    const parseResult = parser.parse('=$B$2', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies.length).toEqual(1)
    expect(dependencies[0]).toMatchObject(adr('B2'))
  })

  it('works for CELL_RANGE', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const formulaAddress = simpleCellAddress(0, 0, 0)

    const parseResult = parser.parse('=B2:C4', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      new AbsoluteCellRange(adr('B2'), adr('C4')),
    ])
  })

  it('goes inside unary minus', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const formulaAddress = simpleCellAddress(0, 0, 0)

    const parseResult = parser.parse('=-B2', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      adr('B2'),
    ])
  })

  it('goes inside plus operator', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const formulaAddress = simpleCellAddress(0, 0, 0)

    const parseResult = parser.parse('=B2+C3', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      adr('B2'),
      adr('C3'),
    ])
  })

  it('goes inside function call arguments', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const formulaAddress = simpleCellAddress(0, 0, 0)

    const parseResult = parser.parse('=SUM(B2, C3)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)

    expect(dependencies).toEqual([
      adr('B2'),
      adr('C3'),
    ])
  })

  it('OFFSET call is correctly found as dependency', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const formulaAddress = simpleCellAddress(0, 1, 1)

    const parseResult = parser.parse('=OFFSET(D4, 0, 0)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)
    expect(dependencies).toEqual([
      adr('D4'),
    ])
  })

  it('COLUMNS arguments are not dependencies', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const formulaAddress = simpleCellAddress(0, 1, 1)

    const parseResult = parser.parse('=COLUMNS(A1:B3)', formulaAddress)
    const dependencies = absolutizeDependencies(parseResult.dependencies, formulaAddress)
    expect(dependencies).toEqual([])
  })
})
