import {Config} from '../../src'
import {ErrorType} from '../../src/Cell'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB, plPL} from '../../src/i18n'
import {AstNodeType, CellAddress, ErrorAst, ParserWithCaching} from '../../src/parser'

describe('Parsing error literals', () => {
  it('should parse error literals', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=#VALUE!', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error!.type).toEqual(ErrorType.VALUE)
  })

  it('should parse error literals with ?', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=#NAME?', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error!.type).toEqual(ErrorType.NAME)
  })

  it('should parse error literals with slashes', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=#N/A', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error!.type).toEqual(ErrorType.NA)
  })

  it('should parse error in other languages', () => {
    const parser = new ParserWithCaching(new Config({language: plPL}), new SheetMapping(plPL).get)
    const ast = parser.parse('=#ARG!', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error!.type).toEqual(ErrorType.VALUE)
  })
})
