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

    const ast = parser.parse('=OFFSET(F16; 0; 0)', absoluteCellAddress(1, 2)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(relativeCellAddress(4, 13))
  })

  it('OFFSET parsing into cell reference with row shift', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(F16; 1; 0)', absoluteCellAddress(1, 2)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(relativeCellAddress(4, 14))
  })

  it('OFFSET parsing into cell reference with column shift', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(F16; 0; 1)', absoluteCellAddress(1, 2)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(relativeCellAddress(5, 13))
  })

  it('OFFSET parsing into cell reference with some height', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(F16; 2; 0; 3)', absoluteCellAddress(1, 2)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start).toEqual(relativeCellAddress(4, 15))
    expect(ast.end).toEqual(relativeCellAddress(4, 17))
  })

  it('OFFSET parsing into cell reference with some width', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(F16; 0; 2; 1; 3)', absoluteCellAddress(1, 2)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start).toEqual(relativeCellAddress(6, 13))
    expect(ast.end).toEqual(relativeCellAddress(8, 13))
  })

  it('OFFSET first argument need to be reference', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(42; 0; 0)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('First argument to OFFSET is not a reference')
  })

  it('OFFSET second argument need to be static number', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(A1; C3; 0)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Second argument to OFFSET is not a static number')
  })

  it('OFFSET third argument need to be static number', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(A1; 0; C3)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Third argument to OFFSET is not a static number')
  })

  it('OFFSET fourth argument need to be static number', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(A1; 0; 0; B3)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fourth argument to OFFSET is not a static number')
  })

  it('OFFSET fourth argument need to be static number bigger than 0', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(A1; 0; 0; 0)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fourth argument to OFFSET is too small number')
  })

  it('OFFSET fifth argument need to be static number', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(A1; 0; 0; 1; B3)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fifth argument to OFFSET is not a static number')
  })

  it('OFFSET fifth argument need to be static number bigger than 0', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=OFFSET(A1; 0; 0; 1; 0)', absoluteCellAddress(0, 0)).ast as ErrorAst
    expect(ast.args[0].name).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fifth argument to OFFSET is too small number')
  })
})
