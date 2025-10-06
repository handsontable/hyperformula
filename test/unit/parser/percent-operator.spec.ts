import {Config} from '../../../src/Config'
import {AstNodeType, MinusUnaryOpAst, PlusOpAst, PlusUnaryOpAst} from '../../../src/parser'
import {PercentOpAst, TimesOpAst} from '../../../src/parser/Ast'
import {adr} from '../testUtils'
import {buildEmptyParserWithCaching} from './common'

describe('percent', () => {
  it('should parse % as operator', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=1%', adr('A1')).ast as PercentOpAst
    expect(ast.type).toBe(AstNodeType.PERCENT_OP)
    expect(ast.value.type).toBe(AstNodeType.NUMBER)
  })

  it('% over unary minus', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=-1%', adr('A1')).ast as MinusUnaryOpAst
    expect(ast.type).toBe(AstNodeType.MINUS_UNARY_OP)
    expect(ast.value.type).toBe(AstNodeType.PERCENT_OP)
  })

  it('% over unary plus', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=+1%', adr('A1')).ast as PlusUnaryOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_UNARY_OP)
    expect(ast.value.type).toBe(AstNodeType.PERCENT_OP)
  })

  it('% over addition op', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=42+1%', adr('A1')).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.type).toBe(AstNodeType.PERCENT_OP)
  })

  it('% over multiplication op', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=42*1%', adr('A1')).ast as TimesOpAst
    expect(ast.type).toBe(AstNodeType.TIMES_OP)
    expect(ast.right.type).toBe(AstNodeType.PERCENT_OP)
  })

  it('% on the left', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=1%+42', adr('A1')).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.PERCENT_OP)
  })

  it('% after procedure', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=SUM(1,2)%', adr('A1')).ast as PercentOpAst
    expect(ast.type).toBe(AstNodeType.PERCENT_OP)
    expect(ast.value.type).toBe(AstNodeType.FUNCTION_CALL)
  })

  it('%% should not parse', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=100%%', adr('A1')).ast as PercentOpAst
    expect(ast.type).toBe(AstNodeType.ERROR)
  })
})
