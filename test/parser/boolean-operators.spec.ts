import {Config} from '../../src'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB} from '../../src/i18n'
import {
  AstNodeType,
  EqualsOpAst,
  GreaterThanOpAst,
  GreaterThanOrEqualOpAst,
  LessThanOpAst,
  LessThanOrEqualOpAst,
  NotEqualOpAst,
  ParserWithCaching,
} from '../../src/parser'
import {CellAddress} from '../../src/parser'

describe('Parser - Boolean operators', () => {
  it('Equals operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const ast = parser.parse('=1=2', CellAddress.absolute(0, 0, 0)).ast as EqualsOpAst

    expect(ast.type).toBe(AstNodeType.EQUALS_OP)
  })

  it('Not equal operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const ast = parser.parse('=1<>2', CellAddress.absolute(0, 0, 0)).ast as NotEqualOpAst

    expect(ast.type).toBe(AstNodeType.NOT_EQUAL_OP)
  })

  it('Greater than operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const ast = parser.parse('=1>2', CellAddress.absolute(0, 0, 0)).ast as GreaterThanOpAst

    expect(ast.type).toBe(AstNodeType.GREATER_THAN_OP)
  })

  it('Less than operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const ast = parser.parse('=1<2', CellAddress.absolute(0, 0, 0)).ast as LessThanOpAst

    expect(ast.type).toBe(AstNodeType.LESS_THAN_OP)
  })

  it('Greater than or equal operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const ast = parser.parse('=1>=2', CellAddress.absolute(0, 0, 0)).ast as GreaterThanOrEqualOpAst

    expect(ast.type).toBe(AstNodeType.GREATER_THAN_OR_EQUAL_OP)
  })

  it('Less than or equal operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const ast = parser.parse('=1<=2', CellAddress.absolute(0, 0, 0)).ast as LessThanOrEqualOpAst

    expect(ast.type).toBe(AstNodeType.LESS_THAN_OR_EQUAL_OP)
  })

  it('Boolean operator with more complex childs', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)

    const ast = parser.parse('=1+2=1+2*6', CellAddress.absolute(0, 0, 0)).ast as EqualsOpAst

    expect(ast.type).toBe(AstNodeType.EQUALS_OP)
    expect(ast.left.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.type).toBe(AstNodeType.PLUS_OP)
  })
})
