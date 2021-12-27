import {ErrorType, HyperFormula} from '../../src'
import {CellError} from '../../src/Cell'
import {Config} from '../../src/Config'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage} from '../../src/i18n'
import {enGB, plPL} from '../../src/i18n/languages'
import {
  AstNodeType,
  buildCellErrorAst,
  CellAddress,
  CellRangeAst,
  CellReferenceAst,
  MinusOpAst,
  MinusUnaryOpAst,
  NamedExpressionAst,
  NumberAst,
  ParsingErrorType,
  PlusOpAst,
  PowerOpAst,
  ProcedureAst,
  StringAst,
} from '../../src/parser'
import {columnIndexToLabel} from '../../src/parser/addressRepresentationConverters'
import {
  ArrayAst,
  buildCellReferenceAst,
  buildColumnRangeAst,
  buildErrorWithRawInputAst,
  buildNumberAst,
  buildRowRangeAst,
  ColumnRangeAst,
  ParenthesisAst,
  RangeSheetReferenceType,
} from '../../src/parser/Ast'
import {ColumnAddress} from '../../src/parser/ColumnAddress'
import {RowAddress} from '../../src/parser/RowAddress'
import {adr, unregisterAllLanguages} from '../testUtils'
import {buildEmptyParserWithCaching} from './common'

describe('ParserWithCaching', () => {
  beforeEach(() => {
    unregisterAllLanguages()
    HyperFormula.registerLanguage(plPL.langCode, plPL)
    HyperFormula.registerLanguage(enGB.langCode, enGB)
  })

  it('integer literal', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=42', adr('A1')).ast
    expect(ast).toEqual(buildNumberAst(42, ast.startOffset, ast.endOffset))
  })

  it('negative integer literal', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=-42', adr('A1')).ast as MinusUnaryOpAst
    expect(ast.type).toBe(AstNodeType.MINUS_UNARY_OP)
    expect(ast.value).toEqual(buildNumberAst(42, ast.startOffset, ast.endOffset))
  })

  it('string literal', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('="foobar"', adr('A1')).ast as StringAst
    expect(ast.type).toBe(AstNodeType.STRING)
    expect(ast.value).toBe('foobar')
  })

  it('plus operator on different nodes', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=1+A5', adr('A1')).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.CELL_REFERENCE)
  })

  it('minus operator', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=1-3', adr('A1')).ast as MinusOpAst
    expect(ast.type).toBe(AstNodeType.MINUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it('power operator', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=2^3', adr('A1')).ast as PowerOpAst
    expect(ast.type).toBe(AstNodeType.POWER_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it('power operator order', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=2*2^3', adr('A1')).ast as PowerOpAst
    expect(ast.type).toBe(AstNodeType.TIMES_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.POWER_OP)
  })

  it('joining nodes without braces', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=1 + 2 + 3', adr('A1')).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it('joining nodes with braces', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=1 + (2 + 3)', adr('A1')).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)

    const right = ast.right as ParenthesisAst
    expect(right.type).toBe(AstNodeType.PARENTHESIS)
    expect(right.expression.type).toBe(AstNodeType.PLUS_OP)
  })

  it('float literal', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=3.14', adr('A1')).ast
    expect(ast).toEqual(buildNumberAst(3.14, ast.startOffset, ast.endOffset))
  })

  it('float literal with different decimal separator', () => {
    const parser = buildEmptyParserWithCaching(new Config({
      decimalSeparator: ',',
      functionArgSeparator: ';'
    }), new SheetMapping(buildTranslationPackage(enGB)))
    const ast1 = parser.parse('=3,14', adr('A1')).ast
    const ast2 = parser.parse('=03,14', adr('A1')).ast
    const ast3 = parser.parse('=,14', adr('A1')).ast

    expect(ast1).toEqual(buildNumberAst(3.14, ast1.startOffset, ast1.endOffset))
    expect(ast2).toEqual(buildNumberAst(3.14, ast2.startOffset, ast2.endOffset))
    expect(ast3).toEqual(buildNumberAst(0.14, ast3.startOffset, ast3.endOffset))
  })

  it('leading zeros of number literals', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const int = parser.parse('=01234', adr('A1')).ast as NumberAst
    const float = parser.parse('=03.14', adr('A1')).ast as NumberAst
    expect(int.type).toBe(AstNodeType.NUMBER)
    expect(int.value).toBe(1234)
    expect(float.type).toBe(AstNodeType.NUMBER)
    expect(float.value).toBe(3.14)
  })

  it('allow to accept different lexer configs', () => {
    const parser1 = buildEmptyParserWithCaching(new Config())
    const parser2 = buildEmptyParserWithCaching(new Config({functionArgSeparator: ';'}), new SheetMapping(buildTranslationPackage(enGB)))

    const ast1 = parser1.parse('=SUM(1, 2)', adr('A1')).ast as ProcedureAst
    const ast2 = parser2.parse('=SUM(1; 2)', adr('A1')).ast as ProcedureAst

    expect(ast1.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast2.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast1).toEqual(ast2)
  })

  it('error literal', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=#REF!', adr('A1')).ast
    expect(ast).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
  })

  it('error literals are case insensitive', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=#rEf!', adr('A1')).ast
    expect(ast).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
  })

  it('reference to address in nonexisting range returns ref error with data input ast', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=Sheet2!A1', adr('A1')).ast

    expect(ast).toEqual(buildErrorWithRawInputAst('Sheet2!A1', new CellError(ErrorType.REF)))
  })
})

describe('Functions', () => {
  beforeEach(() => {
    unregisterAllLanguages()
    HyperFormula.registerLanguage(plPL.langCode, plPL)
    HyperFormula.registerLanguage(enGB.langCode, enGB)
  })

  it('SUM function without args', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=SUM()', adr('A1')).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
    expect(ast.args.length).toBe(0)
  })

  it('SUM function with args', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=SUM(1, A1)', adr('A1')).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
    expect(ast.args[0]!.type).toBe(AstNodeType.NUMBER)
    expect(ast.args[1]!.type).toBe(AstNodeType.CELL_REFERENCE)
  })

  it('SUM function with expression arg', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=SUM(1 / 2 + SUM(1,2))', adr('A1')).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.args.length).toBe(1)
    expect(ast.args[0]!.type).toBe(AstNodeType.PLUS_OP)

    const arg = ast.args[0] as PlusOpAst
    expect(arg.left.type).toBe(AstNodeType.DIV_OP)
    expect(arg.right.type).toBe(AstNodeType.FUNCTION_CALL)
  })

  it('function without polish characters', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=żółćąęźśńŻÓŁĆĄĘŹŚŃ()', adr('A1')).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('ŻÓŁĆĄĘŹŚŃŻÓŁĆĄĘŹŚŃ')
    expect(ast.args.length).toBe(0)
  })

  it('function with dot separator', () => {
    const parser = buildEmptyParserWithCaching(new Config({language: 'plPL'}), new SheetMapping(buildTranslationPackage(plPL)))
    const ast = parser.parse('=NR.SER.OST.DN.MIEŚ()', adr('A1')).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('EOMONTH')
    expect(ast.args.length).toBe(0)
  })

  it('function name should be translated during parsing', () => {
    const parser = buildEmptyParserWithCaching(new Config({language: 'plPL'}), new SheetMapping(buildTranslationPackage(plPL)))
    const ast = parser.parse('=SUMA()', adr('A1')).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
    expect(ast.args.length).toBe(0)
  })

  it('function with number', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=DEC2BIN(4)', adr('A1')).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toEqual('DEC2BIN')
  })

  it('should leave original name if procedure translation not known', () => {
    const parser = buildEmptyParserWithCaching(new Config({language: 'plPL'}), new SheetMapping(buildTranslationPackage(plPL)))
    const ast = parser.parse('=FOOBAR()', adr('A1')).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('FOOBAR')
    expect(ast.args.length).toBe(0)
  })

  it('should be case insensitive', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=sum(1)', adr('A1')).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
  })

  it('should be a valid function name', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    expect((parser.parse('=A()', adr('A1')).ast as ProcedureAst).procedureName).toEqual('A')
    expect((parser.parse('=AA()', adr('A1')).ast as ProcedureAst).procedureName).toEqual('AA')
    expect((parser.parse('=A.B()', adr('A1')).ast as ProcedureAst).procedureName).toEqual('A.B')
    expect((parser.parse('=A.B.C()', adr('A1')).ast as ProcedureAst).procedureName).toEqual('A.B.C')
    expect((parser.parse('=A_B()', adr('A1')).ast as ProcedureAst).procedureName).toEqual('A_B')
    expect((parser.parse('=A42()', adr('A1')).ast as ProcedureAst).procedureName).toEqual('A42')
  })
})

describe('cell references and ranges', () => {
  it('absolute cell reference', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=$B$3', adr('B2')).ast

    expect(ast).toEqual(buildCellReferenceAst(CellAddress.absolute(1, 2)))
  })

  it('relative cell reference', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=B3', adr('B2')).ast

    expect(ast).toEqual(buildCellReferenceAst(CellAddress.relative(1, 0)))
  })

  it('absolute column cell reference', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=$B3', adr('B2')).ast

    expect(ast).toEqual(buildCellReferenceAst(CellAddress.absoluteCol(1, 1)))
  })

  it('absolute row cell reference', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=B$3', adr('B2')).ast

    expect(ast).toEqual(buildCellReferenceAst(CellAddress.absoluteRow(0, 2)))
  })

  it('cell references should not be case sensitive', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=d1', adr('A1')).ast

    expect(ast).toEqual(buildCellReferenceAst(CellAddress.relative(0, 3)))
  })

  it('cell reference by default has sheet from the sheet it is written', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=D1', adr('A1', 1)).ast

    expect(ast).toEqual(buildCellReferenceAst(CellAddress.relative(0, 3)))
  })

  it('cell reference with sheet name', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=Sheet2!D1', adr('A1')).ast

    expect(ast).toEqual(buildCellReferenceAst(CellAddress.relative(0, 3, 1)))
  })

  it('using unknown sheet gives REF', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=Sheet2!A1', adr('A1')).ast

    expect(ast).toEqual(buildErrorWithRawInputAst('Sheet2!A1', new CellError(ErrorType.REF)))
  })

  it('sheet name with other characters', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet_zażółć_gęślą_jaźń')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=Sheet_zażółć_gęślą_jaźń!A1', adr('A1')).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name is case insensitive', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=shEEt2!A1', adr('A1')).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name with spaces', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet with spaces')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse("='Sheet with spaces'!A1", adr('A1')).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name inside quotes', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse("='Sheet2'!A1", adr('A1')).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name inside quotes with special characters', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('~`!@#$%^&*()_-+_=/|?{}[]\"')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse("='~`!@#$%^&*()_-+_=/|?{}[]\"'!A2", adr('A1')).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name inside quotes with escaped quote', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet("Name'with'quotes")
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse("='Name''with''quotes'!A1", adr('A1')).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('simple cell range', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=A1:B2', adr('A1')).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
  })

  it('cell range with both start and end sheets specified', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=Sheet2!A1:Sheet2!B2', adr('A1')).ast as CellRangeAst

    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start.sheet).toEqual(1)
    expect(ast.end.sheet).toEqual(1)
  })

  it('cell range may have only sheet specified in start address but end of range is also absolute', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=Sheet2!A1:B2', adr('A1')).ast as CellRangeAst

    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start.sheet).toEqual(1)
    expect(ast.end.sheet).toEqual(1)
  })

  it('cell range with absolute sheet only on end side is a parsing error', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const {errors} = parser.parse('=A1:Sheet2!B2', adr('A1'))

    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })

  it('cell range with different start and end sheets', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    sheetMapping.addSheet('Sheet3')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=Sheet2!A1:Sheet3!B2', adr('A1')).ast as CellRangeAst

    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start.sheet).toEqual(1)
    expect(ast.end.sheet).toEqual(2)
  })

  it('offset has relative sheet reference', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)
    const ast = parser.parse('=OFFSET(A1, 1, 2)', adr('A1')).ast as CellReferenceAst

    expect(ast.reference.sheet).toBe(undefined)
  })

  it('cell range with nonexsiting start sheet should return REF error with data input', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=Sheet3!A1:Sheet2!B2', adr('A1')).ast

    expect(ast).toEqual(buildErrorWithRawInputAst('Sheet3!A1:Sheet2!B2', new CellError(ErrorType.REF)))
  })

  it('cell range with nonexsiting end sheet should return REF error with data input', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

    const ast = parser.parse('=Sheet2!A1:Sheet3!B2', adr('A1')).ast

    expect(ast).toEqual(buildErrorWithRawInputAst('Sheet2!A1:Sheet3!B2', new CellError(ErrorType.REF)))
  })

  it('cell reference beyond maximum row limit is #NAME', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)
    const maxRow = Config.defaultConfig.maxRows

    const maxRowAst = parser.parse(`=A${maxRow}`, adr('A1')).ast as CellReferenceAst
    const maxRowPlusOneAst = parser.parse(`=A${maxRow + 1}`, adr('A1')).ast

    expect(maxRowAst.type).toEqual(AstNodeType.CELL_REFERENCE)
    expect(maxRowAst.reference.row).toEqual(maxRow - 1)
    expect(maxRowPlusOneAst).toEqual(buildErrorWithRawInputAst(`A${maxRow + 1}`, new CellError(ErrorType.NAME)))
  })

  it('cell reference beyond maximum column limit is #NAME', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)
    const maxColumns = Config.defaultConfig.maxColumns

    const maxColumnAst = parser.parse(`=${columnIndexToLabel(maxColumns - 1)}1`, adr('A1')).ast as CellReferenceAst
    const maxColumnPlusOneAst = parser.parse(`=${columnIndexToLabel(maxColumns)}1`, adr('A1')).ast

    expect(maxColumnAst.type).toEqual(AstNodeType.CELL_REFERENCE)
    expect(maxColumnAst.reference.col).toEqual(maxColumns - 1)
    expect(maxColumnPlusOneAst).toEqual(buildErrorWithRawInputAst(`${columnIndexToLabel(maxColumns)}1`, new CellError(ErrorType.NAME)))
  })

  it('cell range start beyond maximum column/row limit is #NAME', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)
    const maxRow = Config.defaultConfig.maxRows
    const maxColumns = Config.defaultConfig.maxColumns

    const ast1 = parser.parse(`=A${maxRow + 1}:B2`, adr('A1')).ast
    const ast2 = parser.parse(`=${columnIndexToLabel(maxColumns)}1:B2`, adr('A1')).ast

    expect(ast1).toEqual(buildErrorWithRawInputAst(`A${maxRow + 1}:B2`, new CellError(ErrorType.NAME)))
    expect(ast2).toEqual(buildErrorWithRawInputAst(`${columnIndexToLabel(maxColumns)}1:B2`, new CellError(ErrorType.NAME)))
  })

  it('cell range end beyond maximum column/row limit is #NAME', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)
    const maxRow = Config.defaultConfig.maxRows
    const maxColumns = Config.defaultConfig.maxColumns

    const ast1 = parser.parse(`=A1:B${maxRow + 1}`, adr('A1')).ast
    const ast2 = parser.parse(`=A1:${columnIndexToLabel(maxColumns)}1`, adr('A1')).ast

    expect(ast1).toEqual(buildErrorWithRawInputAst(`A1:B${maxRow + 1}`, new CellError(ErrorType.NAME)))
    expect(ast2).toEqual(buildErrorWithRawInputAst(`A1:${columnIndexToLabel(maxColumns)}1`, new CellError(ErrorType.NAME)))
  })
})

describe('Column ranges', () => {
  const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
  sheetMapping.addSheet('Sheet1')
  sheetMapping.addSheet('Sheet2')
  const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

  it('column range', () => {
    const ast = parser.parse('=C:D', adr('A1')).ast
    expect(ast).toEqual(buildColumnRangeAst(ColumnAddress.relative(2), ColumnAddress.relative(3), RangeSheetReferenceType.RELATIVE, ast.startOffset, ast.endOffset))
  })

  it('column range with sheet absolute', () => {
    const ast = parser.parse('=Sheet1!C:D', adr('A1')).ast
    expect(ast).toEqual(buildColumnRangeAst(ColumnAddress.relative(2, 0), ColumnAddress.relative(3, 0), RangeSheetReferenceType.START_ABSOLUTE, ast.startOffset, ast.endOffset))
  })

  it('column range with both sheets absolute - same sheet', () => {
    const ast = parser.parse('=Sheet1!C:Sheet1!D', adr('A1')).ast
    expect(ast).toEqual(buildColumnRangeAst(ColumnAddress.relative(2, 0), ColumnAddress.relative(3, 0), RangeSheetReferenceType.BOTH_ABSOLUTE, ast.startOffset, ast.endOffset))
  })

  it('column range with both sheets absolute - different sheet', () => {
    const ast = parser.parse('=Sheet1!C:Sheet2!D', adr('A1')).ast
    expect(ast).toEqual(buildColumnRangeAst(ColumnAddress.relative(2, 0), ColumnAddress.relative(3, 1), RangeSheetReferenceType.BOTH_ABSOLUTE, ast.startOffset, ast.endOffset))
  })

  it('column range with absolute column address', () => {
    const ast = parser.parse('=$C:D', adr('A1')).ast
    expect(ast).toEqual(buildColumnRangeAst(ColumnAddress.absolute(2), ColumnAddress.relative(3), RangeSheetReferenceType.RELATIVE, ast.startOffset, ast.endOffset))
  })

  it('column range with absolute sheet only on end side is a parsing error', () => {
    const {errors} = parser.parse('=A:Sheet2!B', adr('A1'))
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })

  it('column range beyond size limits is #NAME', () => {
    const maxColumns = Config.defaultConfig.maxColumns
    const ast1 = parser.parse(`=A:${columnIndexToLabel(maxColumns - 1)}`, adr('A1')).ast as ColumnRangeAst
    const ast2 = parser.parse(`=A:${columnIndexToLabel(maxColumns)}`, adr('A1')).ast
    const ast3 = parser.parse(`=${columnIndexToLabel(maxColumns)}:B`, adr('A1')).ast

    expect(ast1.type).toEqual(AstNodeType.COLUMN_RANGE)
    expect(ast2).toEqual(buildErrorWithRawInputAst(`A:${columnIndexToLabel(maxColumns)}`, new CellError(ErrorType.NAME)))
    expect(ast3).toEqual(buildErrorWithRawInputAst(`${columnIndexToLabel(maxColumns)}:B`, new CellError(ErrorType.NAME)))
  })
})

describe('Row ranges', () => {
  const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
  sheetMapping.addSheet('Sheet1')
  sheetMapping.addSheet('Sheet2')
  const parser = buildEmptyParserWithCaching(new Config(), sheetMapping)

  it('row range', () => {
    const ast = parser.parse('=3:4', adr('A1')).ast
    expect(ast).toEqual(buildRowRangeAst(RowAddress.relative(2), RowAddress.relative(3), RangeSheetReferenceType.RELATIVE, ast.startOffset, ast.endOffset))
  })

  it('row range with sheet absolute', () => {
    const ast = parser.parse('=Sheet1!3:4', adr('A1')).ast
    expect(ast).toEqual(buildRowRangeAst(RowAddress.relative(2, 0), RowAddress.relative(3, 0), RangeSheetReferenceType.START_ABSOLUTE, ast.startOffset, ast.endOffset))
  })

  it('row range with both sheets absolute - same sheet', () => {
    const ast = parser.parse('=Sheet1!3:Sheet1!4', adr('A1')).ast
    expect(ast).toEqual(buildRowRangeAst(RowAddress.relative(2, 0), RowAddress.relative(3, 0), RangeSheetReferenceType.BOTH_ABSOLUTE, ast.startOffset, ast.endOffset))
  })

  it('row range with both sheets absolute - different sheet', () => {
    const ast = parser.parse('=Sheet1!3:Sheet2!4', adr('A1')).ast
    expect(ast).toEqual(buildRowRangeAst(RowAddress.relative(2, 0), RowAddress.relative(3, 1), RangeSheetReferenceType.BOTH_ABSOLUTE, ast.startOffset, ast.endOffset))
  })

  it('row range with absolute row address', () => {
    const ast = parser.parse('=$3:4', adr('A1')).ast
    expect(ast).toEqual(buildRowRangeAst(RowAddress.absolute(2), RowAddress.relative(3), RangeSheetReferenceType.RELATIVE, ast.startOffset, ast.endOffset))
  })

  it('row range with absolute sheet only on end side is a parsing error', () => {
    const {errors} = parser.parse('=1:Sheet2!2', adr('A1'))
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })
})

describe('Named expressions', () => {
  it('should be a valid name for named expression', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    expect((parser.parse('=_A', adr('A1')).ast as NamedExpressionAst).expressionName).toEqual('_A')
    expect((parser.parse('=A', adr('A1')).ast as NamedExpressionAst).expressionName).toEqual('A')
    expect((parser.parse('=Aa', adr('A1')).ast as NamedExpressionAst).expressionName).toEqual('Aa')
    expect((parser.parse('=B.', adr('A1')).ast as NamedExpressionAst).expressionName).toEqual('B.')
    expect((parser.parse('=foo_bar', adr('A1')).ast as NamedExpressionAst).expressionName).toEqual('foo_bar')
    expect((parser.parse('=A...', adr('A1')).ast as NamedExpressionAst).expressionName).toEqual('A...')
    expect((parser.parse('=B___', adr('A1')).ast as NamedExpressionAst).expressionName).toEqual('B___')
  })

  it('named expression ast with leading whitespace', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('= true', adr('A1')).ast as NamedExpressionAst

    expect(ast.type).toBe(AstNodeType.NAMED_EXPRESSION)
    expect(ast.expressionName).toBe('true')
    expect(ast.leadingWhitespace).toBe(' ')
  })
})

describe('Matrices', () => {
  it('simplest matrix', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('={1}', adr('A1')).ast as ArrayAst
    expect(ast.type).toBe(AstNodeType.ARRAY)
    expect(ast.args.length).toEqual(1)
    expect(ast.args[0].length).toEqual(1)
  })

  it('row matrix', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('={1,2,3}', adr('A1')).ast as ArrayAst
    expect(ast.type).toBe(AstNodeType.ARRAY)
    expect(ast.args.length).toEqual(1)
    expect(ast.args[0].length).toEqual(3)
  })

  it('column matrix', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('={1;2;3}', adr('A1')).ast as ArrayAst
    expect(ast.type).toBe(AstNodeType.ARRAY)
    expect(ast.args.length).toEqual(3)
    expect(ast.args[0].length).toEqual(1)
    expect(ast.args[1].length).toEqual(1)
    expect(ast.args[2].length).toEqual(1)
  })

  it('square matrix', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('={1,2,3;4,5,6;7,8,9}', adr('A1')).ast as ArrayAst
    expect(ast.type).toBe(AstNodeType.ARRAY)
    expect(ast.args.length).toEqual(3)
    expect(ast.args[0].length).toEqual(3)
    expect(ast.args[1].length).toEqual(3)
    expect(ast.args[2].length).toEqual(3)
  })

  it('longer matrix with extras', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('={SUM(1,2,3),2,{1,2,3}}', adr('A1')).ast as ArrayAst
    expect(ast.type).toBe(AstNodeType.ARRAY)
    expect(ast.args.length).toEqual(1)
    expect(ast.args[0].length).toEqual(3)
    const ast2 = ast.args[0][2] as ArrayAst
    expect(ast2.type).toBe(AstNodeType.ARRAY)
    expect(ast2.args.length).toEqual(1)
    expect(ast2.args[0].length).toEqual(3)
  })

  it('matrix in other expressions', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=1+{1,2,3}', adr('A1')).ast as PlusOpAst
    const ast2 = ast.right as ArrayAst
    expect(ast2.type).toBe(AstNodeType.ARRAY)
    expect(ast2.args.length).toEqual(1)
    expect(ast2.args[0].length).toEqual(3)
  })

  it('square matrix, other separators', () => {
    const parser = buildEmptyParserWithCaching(new Config({arrayRowSeparator: '|', arrayColumnSeparator: ';'}))

    const ast = parser.parse('={1;2;3|4;5;6|7;8;9}', adr('A1')).ast as ArrayAst
    expect(ast.type).toBe(AstNodeType.ARRAY)
    expect(ast.args.length).toEqual(3)
    expect(ast.args[0].length).toEqual(3)
    expect(ast.args[1].length).toEqual(3)
    expect(ast.args[2].length).toEqual(3)
  })
})

describe('Parsing errors', () => {
  it('errors - lexing errors', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const input = ["='foo'", "=foo'bar", "=''''''", '=@']

    input.forEach((formula) => {
      const {ast, errors} = parser.parse(formula, adr('A1'))
      expect(ast.type).toBe(AstNodeType.ERROR)
      expect(errors[0].type).toBe(ParsingErrorType.LexingError)
    })
  })

  it('parsing error - not all input parsed', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {errors} = parser.parse('=A1B1', adr('A1'))
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })

  it('unknown error literal', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const {ast, errors} = parser.parse('=#FOO!', adr('A1'))
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })
})
