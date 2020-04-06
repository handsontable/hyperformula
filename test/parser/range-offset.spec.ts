import {simpleCellAddress} from '../../src/Cell'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage, enGB} from '../../src/i18n'
import {AstNodeType, CellRangeAst, ParserWithCaching, ParsingErrorType} from '../../src/parser'
import {RangeSheetReferenceType} from '../../src/parser/Ast'
import {Config} from '../../src'

describe('Parser - range offset', () => {
  it('OFFSET - usage with range', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=A1:OFFSET(A1, 1, 1, 1, 1)', simpleCellAddress(0, 0, 0)).ast as CellRangeAst
    const ast2 = parser.parse('=OFFSET(A1, 1, 1, 1, 1):OFFSET(B2, 1, 1, 1, 1)', simpleCellAddress(0, 0, 0)).ast as CellRangeAst
    const ast3 = parser.parse('=OFFSET(A1, 1, 1, 1, 1):B3', simpleCellAddress(0, 0, 0)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast2.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast3.type).toBe(AstNodeType.CELL_RANGE)
  })

  it('OFFSET - range offset not allowed', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const { errors: errors1 } = parser.parse('=A1:OFFSET(B2, 0, 0, 2, 2)', simpleCellAddress(0, 0, 0))
    const { errors: errors2 } = parser.parse('=OFFSET(A1,0,0,2,2):A2', simpleCellAddress(0, 0, 0))

    expect(errors1[0].type).toBe(ParsingErrorType.RangeOffsetNotAllowed)
    expect(errors2[0].type).toBe(ParsingErrorType.RangeOffsetNotAllowed)
  })

  it('OFFSET - sheet reference in range with offset start is ABSOLUTE', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)
    const ast = parser.parse('=OFFSET(A1,0,0):OFFSET(B2,0,0)', simpleCellAddress(0, 0, 0)).ast as CellRangeAst

    expect(ast.type).toEqual(AstNodeType.CELL_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.RELATIVE)
  })

  it('OFFSET - sheet reference in range with absolute start is START_ABSOLUTE', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)
    const ast = parser.parse('=Sheet1!A1:OFFSET(B2,0,0)', simpleCellAddress(0, 0, 0)).ast as CellRangeAst

    expect(ast.type).toEqual(AstNodeType.CELL_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.START_ABSOLUTE)
  })
})
