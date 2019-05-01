import {CellAddress} from '../../src/CellAddress'
import {Config} from '../../src/Config'
import {
  AstNodeType,
  CellRangeAst,
  CellReferenceAst,
  ErrorAst,
  ParserWithCaching
} from '../../src/parser'
import {SheetMapping} from '../../src/SheetMapping'

describe('Parser - OFFSET to reference translation', () => {
  it('OFFSET parsing into cell reference', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(F16, 0, 0)', CellAddress.absolute(0, 1, 2)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(0, 4, 13))
  })

  it('OFFSET parsing into cell reference with row shift', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(F16, 1, 0)', CellAddress.absolute(0, 1, 2)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(0, 4, 14))
  })

  it('OFFSET parsing into cell reference with negative row shift', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(C3, -1, 0)', CellAddress.absolute(0, 1, 1)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('OFFSET parsing into cell reference with column shift', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(F16, 0, 1)', CellAddress.absolute(0, 1, 2)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(0, 5, 13))
  })

  it('OFFSET parsing into cell reference with negative column shift', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(C3, 0, -1)', CellAddress.absolute(0, 1, 1)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(0, 0, 1))
  })

  it('OFFSET parsing into cell reference with some height', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(F16, 2, 0, 3)', CellAddress.absolute(0, 1, 2)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start).toEqual(CellAddress.relative(0, 4, 15))
    expect(ast.end).toEqual(CellAddress.relative(0, 4, 17))
  })

  it('OFFSET parsing into cell reference with some width', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(F16, 0, 2, 1, 3)', CellAddress.absolute(0, 1, 2)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start).toEqual(CellAddress.relative(0, 6, 13))
    expect(ast.end).toEqual(CellAddress.relative(0, 8, 13))
  })

  it('OFFSET first argument need to be reference', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(42, 0, 0)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('First argument to OFFSET is not a reference')
  })

  it('OFFSET second argument need to be static number', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, C3, 0)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Second argument to OFFSET is not a static number')
  })

  it('OFFSET second argument need to be integer', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 1.3, 0)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Second argument to OFFSET is not a static number')
  })

  it('OFFSET third argument need to be static number', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 0, C3)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Third argument to OFFSET is not a static number')
  })

  it('OFFSET third argument need to be integer', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 0, 1.3)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Third argument to OFFSET is not a static number')
  })

  it('OFFSET fourth argument need to be static number', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 0, 0, B3)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fourth argument to OFFSET is not a static number')
  })

  it('OFFSET fourth argument need to be static number bigger than 0', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 0, 0, 0)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fourth argument to OFFSET is too small number')
  })

  it('OFFSET fourth argument need to be integer', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 0, 0, 1.3)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fourth argument to OFFSET is not integer')
  })

  it('OFFSET fifth argument need to be static number', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 0, 0, 1, B3)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fifth argument to OFFSET is not a static number')
  })

  it('OFFSET fifth argument need to be static number bigger than 0', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 0, 0, 1, 0)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fifth argument to OFFSET is too small number')
  })

  it('OFFSET fifth argument need to be integer', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 0, 0, 1, 1.3)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetError')
    expect(ast.args[0].message).toBe('Fifth argument to OFFSET is not integer')
  })

  it('OFFSET resulting reference out of the sheet in top left row', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, -1, 0)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetOutOfRangeError')
    expect(ast.args[0].message).toBe('Resulting reference is out of the sheet')
  })

  it('OFFSET resulting reference out of the sheet in top left column', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=OFFSET(A1, 0, -1)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.args[0].type).toBe('StaticOffsetOutOfRangeError')
    expect(ast.args[0].message).toBe('Resulting reference is out of the sheet')
  })

  it('OFFSET case insensitive', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())

    const ast = parser.parse('=oFfSeT(F16, 0, 0)', CellAddress.absolute(0, 1, 2)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(0, 4, 13))
  })
})
