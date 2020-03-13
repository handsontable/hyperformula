import {buildConfig} from '../../src'
import {ErrorType} from '../../src/Cell'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB, plPL} from '../../src/i18n'
import {AstNodeType, CellAddress, ErrorAst, ParserWithCaching, ParsingErrorType} from '../../src/parser'

describe('Parsing error literals', () => {
  it('should parse error literals', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=#VALUE!', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error.type).toEqual(ErrorType.VALUE)
  })

  it('should parse error literals with ?', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=#NAME?', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error.type).toEqual(ErrorType.NAME)
  })

  it('should parse error literals with slashes', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=#N/A', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error.type).toEqual(ErrorType.NA)
  })

  it('should parse error in other languages', () => {
    const parser = new ParserWithCaching(buildConfig({language: plPL}), new SheetMapping(plPL).get)
    const ast = parser.parse('=#ARG!', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error.type).toEqual(ErrorType.VALUE)
  })

  it('should parse #DIV/0!', () => {
    const parser = new ParserWithCaching(buildConfig({language: enGB}), new SheetMapping(enGB).get)
    const ast = parser.parse('=#DIV/0!', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error.type).toEqual(ErrorType.DIV_BY_ZERO)
  })

  it('should return parser error', () => {
    const parser = new ParserWithCaching(buildConfig({language: enGB}), new SheetMapping(enGB).get)
    const { ast, errors } = parser.parse('=#UNKNOWN!', CellAddress.absolute(0, 0, 0))
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
    expect(errors[0].message).toBe('Unknown error literal')
  })
})
