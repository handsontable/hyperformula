import {CellError, ErrorType} from '../../src/Cell'
import {Config} from '../../src/Config'
import {ErrorMessage} from '../../src/error-message'
import {AstNodeType, CellAddress, CellRangeAst, CellReferenceAst, ErrorAst} from '../../src/parser'
import {adr} from '../testUtils'
import {buildEmptyParserWithCaching} from './common'

describe('Parser - OFFSET to reference translation', () => {
  it('OFFSET parsing into cell reference', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=OFFSET(F16, 0, 0)', adr('B3', 1)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(13, 4))
  })

  it('OFFSET parsing into cell reference with row shift', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=OFFSET(F16, 1, 0)', adr('B3', 1)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(14, 4))
  })

  it('OFFSET parsing into cell reference with negative row shift', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=OFFSET(C3, -1, 0)', adr('B2')).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(0, 1))
  })

  it('OFFSET parsing into cell reference with column shift', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=OFFSET(F16, 0, 1)', adr('B3', 1)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(13, 5))
  })

  it('OFFSET parsing into cell reference with negative column shift', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=OFFSET(C3, 0, -1)', adr('B2')).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(1, 0))
  })

  it('OFFSET parsing into cell reference with some height', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=OFFSET(F16, 2, 0, 3)', adr('B3', 1)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start).toEqual(CellAddress.relative(15, 4))
    expect(ast.end).toEqual(CellAddress.relative(17, 4))
  })

  it('OFFSET parsing into cell reference with some width', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=OFFSET(F16, 0, 2, 1, 3)', adr('B3', 1)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start).toEqual(CellAddress.relative(13, 6))
    expect(ast.end).toEqual(CellAddress.relative(13, 8))
  })

  it('OFFSET first argument need to be reference', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(42, 0, 0)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('First argument to OFFSET is not a reference')
  })

  it('OFFSET second argument need to be static number', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, C3, 0)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Second argument to OFFSET is not a static number')
  })

  it('OFFSET second argument need to be integer', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, 1.3, 0)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Second argument to OFFSET is not a static number')
  })

  it('OFFSET third argument need to be static number', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, 0, C3)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Third argument to OFFSET is not a static number')
  })

  it('OFFSET third argument need to be integer', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, 0, 1.3)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Third argument to OFFSET is not a static number')
  })

  it('OFFSET fourth argument need to be static number', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, 0, 0, B3)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Fourth argument to OFFSET is not a static number')
  })

  it('OFFSET fourth argument need to be static number bigger than 0', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, 0, 0, 0)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Fourth argument to OFFSET is too small number')
  })

  it('OFFSET fourth argument need to be integer', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, 0, 0, 1.3)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Fourth argument to OFFSET is not integer')
  })

  it('OFFSET fifth argument need to be static number', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, 0, 0, 1, B3)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Fifth argument to OFFSET is not a static number')
  })

  it('OFFSET fifth argument need to be static number bigger than 0', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, 0, 0, 1, 0)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Fifth argument to OFFSET is too small number')
  })

  it('OFFSET fifth argument need to be integer', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=OFFSET(A1, 0, 0, 1, 1.3)', adr('A1'))
    expect(errors[0].type).toBe('StaticOffsetError')
    expect(errors[0].message).toBe('Fifth argument to OFFSET is not integer')
  })

  it('OFFSET resulting reference out of the sheet in top left row', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {ast, errors} = parser.parse('=OFFSET(A1, -1, 0)', adr('A1'))
    expect(errors.length).toBe(0)
    expect((ast as ErrorAst).error).toEqual(new CellError(ErrorType.REF, ErrorMessage.OutOfSheet))
  })

  it('OFFSET resulting reference out of the sheet in top left column', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {ast, errors} = parser.parse('=OFFSET(A1, 0, -1)', adr('A1'))
    expect(errors.length).toBe(0)
    expect((ast as ErrorAst).error).toEqual(new CellError(ErrorType.REF, ErrorMessage.OutOfSheet))
  })

  it('OFFSET case insensitive', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=oFfSeT(F16, 0, 0)', adr('B3', 1)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(13, 4))
  })
})
