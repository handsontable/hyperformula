import {Config} from '../../src/Config'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage} from '../../src/i18n'
import {enGB} from '../../src/i18n/languages'
import {AstNodeType, CellRangeAst, ParsingErrorType} from '../../src/parser'
import {RangeSheetReferenceType} from '../../src/parser/Ast'
import {adr} from '../testUtils'
import {buildEmptyParserWithCaching} from './common'

describe('Parser - range offset', () => {
  it('OFFSET - usage with range', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=A1:OFFSET(A1, 1, 1, 1, 1)', adr('A1')).ast as CellRangeAst
    const ast2 = parser.parse('=OFFSET(A1, 1, 1, 1, 1):OFFSET(B2, 1, 1, 1, 1)', adr('A1')).ast as CellRangeAst
    const ast3 = parser.parse('=OFFSET(A1, 1, 1, 1, 1):B3', adr('A1')).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast2.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast3.type).toBe(AstNodeType.CELL_RANGE)
  })

  it('OFFSET - range offset not allowed', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors: errors1} = parser.parse('=A1:OFFSET(B2, 0, 0, 2, 2)', adr('A1'))
    const {errors: errors2} = parser.parse('=OFFSET(A1,0,0,2,2):A2', adr('A1'))

    expect(errors1[0].type).toBe(ParsingErrorType.RangeOffsetNotAllowed)
    expect(errors2[0].type).toBe(ParsingErrorType.RangeOffsetNotAllowed)
  })

  it('OFFSET - sheet reference in range with offset start is ABSOLUTE', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)
    const ast = parser.parse('=OFFSET(A1,0,0):OFFSET(B2,0,0)', adr('A1')).ast as CellRangeAst

    expect(ast.type).toEqual(AstNodeType.CELL_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.RELATIVE)
  })

  it('OFFSET - sheet reference in range with absolute start is START_ABSOLUTE', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)
    const ast = parser.parse('=Sheet1!A1:OFFSET(B2,0,0)', adr('A1')).ast as CellRangeAst

    expect(ast.type).toEqual(AstNodeType.CELL_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.START_ABSOLUTE)
  })
})
