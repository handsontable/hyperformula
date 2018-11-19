import {absoluteCellAddress, relativeCellAddress} from '../../src/Cell'
import {
  AstNodeType,
  CellRangeAst,
  CellReferenceAst,
  ErrorAst,
} from '../../src/parser/Ast'
import {ParserWithCaching} from '../../src/parser/ParserWithCaching'

describe('Parser - OFFSET to reference translation', () => {
  it('OFFSET parsing into cell reference', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(B2; 0; 0)', absoluteCellAddress(0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(relativeCellAddress(1, 1))
  })

  it('OFFSET parsing into cell reference with row shift', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(B2; 1; 0)', absoluteCellAddress(0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(relativeCellAddress(1, 2))
  })

  it('OFFSET parsing into cell reference with column shift', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(B2; 0; 1)', absoluteCellAddress(0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(relativeCellAddress(2, 1))
  })

  it('OFFSET parsing into cell reference with some height', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(B2; 1; 1; 3; 1)', absoluteCellAddress(0, 0)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start).toEqual(relativeCellAddress(2, 2))
    expect(ast.end).toEqual(relativeCellAddress(2, 4))
  })

  it('OFFSET parsing into cell reference with some width', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(B2; 1; 1; 1; 3)', absoluteCellAddress(0, 0)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start).toEqual(relativeCellAddress(2, 2))
    expect(ast.end).toEqual(relativeCellAddress(4, 2))
  })

  it('OFFSET first argument need to be reference', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(42; 0; 0)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('First argument to OFFSET is not a reference')
  })

  it('OFFSET second argument need to be static number', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(B2; C3; 0)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Second argument to OFFSET is not a static number')
  })

  it('OFFSET third argument need to be static number', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(B2; 0; C3)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Third argument to OFFSET is not a static number')
  })

  it('OFFSET fourth argument need to be static number', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(B2; 0; 0; B3)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fourth argument to OFFSET is not a static number')
  })

  it('OFFSET fifth argument need to be static number', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(B2; 0; 0; 1; B3)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fifth argument to OFFSET is not a static number')
  })
})
