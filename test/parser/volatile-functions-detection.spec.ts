import {simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {adr} from '../testUtils'
import {buildEmptyParserWithCaching} from './common'

describe('ParserWithCaching - volatile functions detection', () => {
  it('detects volatile functions', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const result = parser.parse('=RAND()', adr('A1'))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('detects volatile functions inside other functions', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const result = parser.parse('=SUM(RAND())', adr('A1'))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('detects volatile functions in unary operators', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const result = parser.parse('=-RAND()', adr('A1'))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('detects volatile functions in right arg of binary operators', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const result = parser.parse('=42+RAND()', adr('A1'))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('detects volatile functions in left arg of binary operators', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const result = parser.parse('=RAND()+42', adr('A1'))
    expect(result.hasVolatileFunction).toBe(true)
  })

  it('not all functions are volatile', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const result = parser.parse('=SUM()', adr('A1'))
    expect(result.hasVolatileFunction).toBe(false)
  })
})

describe('ParserWithCaching - structural change functions detection', () => {
  it('detects volatile functions', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const result = parser.parse('=COLUMNS()', adr('A1'))
    expect(result.hasStructuralChangeFunction).toBe(true)
  })

  it('not all functions are dependent on structure changes', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const result = parser.parse('=SUM()', adr('A1'))
    expect(result.hasStructuralChangeFunction).toBe(false)
  })
})
