import {ErrorType, HyperFormula} from '../../src'
import {CellError, simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage, enGB, plPL} from '../../src/i18n'
import {
  AstNodeType,
  CellAddress,
  CellRangeAst,
  CellReferenceAst,
  ErrorAst,
  MinusOpAst,
  MinusUnaryOpAst,
  NumberAst,
  ParserWithCaching,
  ParsingErrorType,
  PlusOpAst,
  PowerOpAst,
  ProcedureAst,
  NamedExpressionAst,
  StringAst,
} from '../../src/parser'
import {
  ColumnRangeAst,
  ErrorWithRawInputAst,
  ParenthesisAst,
  RangeSheetReferenceType,
  RowRangeAst
} from '../../src/parser/Ast'
import {ColumnAddress} from '../../src/parser/ColumnAddress'
import {adr, unregisterAllLanguages} from '../testUtils'
import {RowAddress} from '../../src/parser/RowAddress'
import {columnIndexToLabel} from '../../src/parser/addressRepresentationConverters'

describe('ParserWithCaching', () => {
  beforeEach(() => {
    unregisterAllLanguages()
    HyperFormula.registerLanguage('plPL', plPL)
    HyperFormula.registerLanguage('enGB', enGB)
  })

  it('integer literal', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=42', simpleCellAddress(0, 0, 0)).ast as NumberAst
    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(42)
  })

  it('negative integer literal', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=-42', simpleCellAddress(0, 0, 0)).ast as MinusUnaryOpAst
    expect(ast.type).toBe(AstNodeType.MINUS_UNARY_OP)
    const value = ast.value as NumberAst
    expect(value.type).toBe(AstNodeType.NUMBER)
    expect(value.value).toBe(42)
  })

  it('string literal', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('="foobar"', simpleCellAddress(0, 0, 0)).ast as StringAst
    expect(ast.type).toBe(AstNodeType.STRING)
    expect(ast.value).toBe('foobar')
  })

  it('plus operator on different nodes', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=1+A5', simpleCellAddress(0, 0, 0)).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.CELL_REFERENCE)
  })

  it('minus operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=1-3', simpleCellAddress(0, 0, 0)).ast as MinusOpAst
    expect(ast.type).toBe(AstNodeType.MINUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it('power operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=2^3', simpleCellAddress(0, 0, 0)).ast as PowerOpAst
    expect(ast.type).toBe(AstNodeType.POWER_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it('power operator order', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=2*2^3', simpleCellAddress(0, 0, 0)).ast as PowerOpAst
    expect(ast.type).toBe(AstNodeType.TIMES_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.POWER_OP)
  })

  it('SUM function without args', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast = parser.parse('=SUM()', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
    expect(ast.args.length).toBe(0)
  })

  it('function without polish characters', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast = parser.parse('=żółćąęźśńŻÓŁĆĄĘŹŚŃ()', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('ŻÓŁĆĄĘŹŚŃŻÓŁĆĄĘŹŚŃ')
    expect(ast.args.length).toBe(0)
  })

  it('function with dot separator', () => {
    const parser = new ParserWithCaching(new Config({ language: 'plPL' }), new SheetMapping(buildTranslationPackage(plPL)).get)
    const ast = parser.parse('=NR.SER.OST.DN.MIEŚ()', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('EOMONTH')
    expect(ast.args.length).toBe(0)
  })

  it('function name should be translated during parsing', () => {
    const parser = new ParserWithCaching(new Config({ language: 'plPL' }), new SheetMapping(buildTranslationPackage(plPL)).get)
    const ast = parser.parse('=SUMA()', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
    expect(ast.args.length).toBe(0)
  })

  it('function with number', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast = parser.parse('=DEC2BIN(4)', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toEqual('DEC2BIN')
  })

  it('should leave original name if procedure translation not known', () => {
    const parser = new ParserWithCaching(new Config({ language: 'plPL' }), new SheetMapping(buildTranslationPackage(plPL)).get)
    const ast = parser.parse('=FOOBAR()', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('FOOBAR')
    expect(ast.args.length).toBe(0)
  })

  it('SUM function with args', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast = parser.parse('=SUM(1, A1)', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
    expect(ast.args[0]!.type).toBe(AstNodeType.NUMBER)
    expect(ast.args[1]!.type).toBe(AstNodeType.CELL_REFERENCE)
  })

  it('SUM function with expression arg', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast = parser.parse('=SUM(1 / 2 + SUM(1,2))', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.args.length).toBe(1)
    expect(ast.args[0]!.type).toBe(AstNodeType.PLUS_OP)

    const arg = ast.args[0] as PlusOpAst
    expect(arg.left.type).toBe(AstNodeType.DIV_OP)
    expect(arg.right.type).toBe(AstNodeType.FUNCTION_CALL)
  })

  it('joining nodes without braces', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast = parser.parse('=1 + 2 + 3', simpleCellAddress(0, 0, 0)).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it('joining nodes with braces', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast = parser.parse('=1 + (2 + 3)', simpleCellAddress(0, 0, 0)).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)

    const right = ast.right as ParenthesisAst
    expect(right.type).toBe(AstNodeType.PARENTHESIS)
    expect(right.expression.type).toBe(AstNodeType.PLUS_OP)
  })

  it('float literal', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast = parser.parse('=3.14', simpleCellAddress(0, 0, 0)).ast as NumberAst
    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(3.14)
  })

  it('float literal with different decimal separator', () => {
    const parser = new ParserWithCaching(new Config({ decimalSeparator: ',', functionArgSeparator: ';' }), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast1 = parser.parse('=3,14', simpleCellAddress(0, 0, 0)).ast as NumberAst
    const ast2 = parser.parse('=03,14', simpleCellAddress(0, 0, 0)).ast as NumberAst
    const ast3 = parser.parse('=,14', simpleCellAddress(0, 0, 0)).ast as NumberAst

    expect(ast1.type).toBe(AstNodeType.NUMBER)
    expect(ast1.value).toBe(3.14)
    expect(ast2.type).toBe(AstNodeType.NUMBER)
    expect(ast2.value).toBe(3.14)
    expect(ast3.type).toBe(AstNodeType.NUMBER)
    expect(ast3.value).toBe(0.14)
  })

  it('leading zeros of number literals', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const int = parser.parse('=01234', simpleCellAddress(0, 0, 0)).ast as NumberAst
    const float = parser.parse('=03.14', simpleCellAddress(0, 0, 0)).ast as NumberAst
    expect(int.type).toBe(AstNodeType.NUMBER)
    expect(int.value).toBe(1234)
    expect(float.type).toBe(AstNodeType.NUMBER)
    expect(float.value).toBe(3.14)
  })

  it('functions should not be case sensitive', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const ast = parser.parse('=sum(1)', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
  })

  it('allow to accept different lexer configs', () => {
    const parser1 = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)
    const parser2 = new ParserWithCaching(new Config({ functionArgSeparator: ';' }), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast1 = parser1.parse('=SUM(1, 2)', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    const ast2 = parser2.parse('=SUM(1; 2)', simpleCellAddress(0, 0, 0)).ast as ProcedureAst

    expect(ast1.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast2.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast1).toEqual(ast2)
  })

  it('error literal', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=#REF!', simpleCellAddress(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error).toEqual(new CellError(ErrorType.REF))
  })

  it('error literals are case insensitive', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=#rEf!', simpleCellAddress(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error).toEqual(new CellError(ErrorType.REF))
  })

  it('refernece to address in unexsiting range returns ref error with raw input ast', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!A1', simpleCellAddress(0, 0, 0)).ast as ErrorWithRawInputAst

    expect(ast.type).toBe(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(ast.rawInput).toBe('Sheet2!A1')
    expect(ast.error.type).toBe(ErrorType.REF)
  })

  it('named expression ast', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('= true', simpleCellAddress(0, 0, 0)).ast as NamedExpressionAst

    expect(ast.type).toBe(AstNodeType.NAMED_EXPRESSION)
    expect(ast.expressionName).toBe('true')
    expect(ast.leadingWhitespace).toBe(' ')
  })
})

describe('cell references and ranges', () => {
  it('absolute cell reference', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=$B$3', simpleCellAddress(0, 1, 1)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.absolute(null, 1, 2))
  })

  it('relative cell reference', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=B3', simpleCellAddress(0, 1, 1)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(null, 0, 1))
  })

  it('absolute column cell reference', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=$B3', simpleCellAddress(0, 1, 1)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.absoluteCol(null, 1, 1))
  })

  it('absolute row cell reference', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=B$3', simpleCellAddress(0, 1, 1)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.absoluteRow(null, 0, 2))
  })

  it('cell references should not be case sensitive', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=d1', simpleCellAddress(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.col).toBe(3)
    expect(ast.reference.row).toBe(0)
  })

  it('cell reference by default has sheet from the sheet it is written', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=D1', simpleCellAddress(1, 0, 0)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(null)
    expect(ast.reference.col).toBe(3)
    expect(ast.reference.row).toBe(0)
  })

  it('cell reference with sheet name', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!D1', simpleCellAddress(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
    expect(ast.reference.col).toBe(3)
    expect(ast.reference.row).toBe(0)
  })

  it('using unknown sheet gives REF', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=Sheet2!A1', simpleCellAddress(0, 0, 0)).ast as ErrorWithRawInputAst

    expect(ast.type).toBe(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(ast.rawInput).toBe('Sheet2!A1')
    expect(ast.error).toEqual(new CellError(ErrorType.REF))
  })

  it('sheet name with other characters', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet_zażółć_gęślą_jaźń')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=Sheet_zażółć_gęślą_jaźń!A1', simpleCellAddress(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name is case insensitive', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=shEEt2!A1', simpleCellAddress(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name with spaces', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet with spaces')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse("='Sheet with spaces'!A1", simpleCellAddress(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name inside quotes', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse("='Sheet2'!A1", simpleCellAddress(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  xit('escaping support', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet("Some'sheet")
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse("='Some''sheet'!A1", simpleCellAddress(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('simple cell range', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const ast = parser.parse('=A1:B2', simpleCellAddress(0, 0, 0)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
  })

  it('cell range with both start and end sheets specified', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!A1:Sheet2!B2', simpleCellAddress(0, 0, 0)).ast as CellRangeAst

    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start.sheet).toEqual(1)
    expect(ast.end.sheet).toEqual(1)
  })

  it('cell range may have only sheet specified in start address but end of range is also absolute', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!A1:B2', simpleCellAddress(0, 0, 0)).ast as CellRangeAst

    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start.sheet).toEqual(1)
    expect(ast.end.sheet).toEqual(1)
  })

  it('cell range with absolute sheet only on end side is a parsing error', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const { errors } = parser.parse('=A1:Sheet2!B2', simpleCellAddress(0, 0, 0))

    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })

  it('cell range with different start and end sheets', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    sheetMapping.addSheet('Sheet3')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!A1:Sheet3!B2', simpleCellAddress(0, 0, 0)).ast as CellRangeAst

    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start.sheet).toEqual(1)
    expect(ast.end.sheet).toEqual(2)
  })

  it('offset has relative sheet reference', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)
    const ast = parser.parse('=OFFSET(A1, 1, 2)', simpleCellAddress(0, 0, 0)).ast as CellReferenceAst

    expect(ast.reference.sheet).toBe(null)
  })

  it('cell range with unexisting start sheet should return REF error with raw input', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=Sheet3!A1:Sheet2!B2', simpleCellAddress(0, 0, 0)).ast as ErrorWithRawInputAst

    expect(ast.type).toBe(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(ast.rawInput).toBe('Sheet3!A1:Sheet2!B2')
    expect(ast.error.type).toBe(ErrorType.REF)
  })

  it('cell range with unexisting end sheet should return REF error with raw input', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!A1:Sheet3!B2', simpleCellAddress(0, 0, 0)).ast as ErrorWithRawInputAst

    expect(ast.type).toBe(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(ast.rawInput).toBe('Sheet2!A1:Sheet3!B2')
    expect(ast.error.type).toBe(ErrorType.REF)
  })

  it('cell reference beyond maximum row limit is #NAME', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)
    const maxRow = Config.defaultConfig.maxRows

    const maxRowAst = parser.parse(`=A${maxRow}`, adr('A1')).ast as CellReferenceAst
    const maxRowPlusOneAst = parser.parse(`=A${maxRow + 1}`, adr('A1')).ast as ErrorWithRawInputAst

    expect(maxRowAst.type).toEqual(AstNodeType.CELL_REFERENCE)
    expect(maxRowAst.reference.row).toEqual(maxRow - 1)
    expect(maxRowPlusOneAst.type).toEqual(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(maxRowPlusOneAst.rawInput).toEqual(`A${maxRow + 1}`)
    expect(maxRowPlusOneAst.error).toEqual(new CellError(ErrorType.NAME))
  })

  it('cell reference beyond maximum column limit is #NAME', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)
    const maxColumns = Config.defaultConfig.maxColumns

    const maxColumnAst = parser.parse(`=${columnIndexToLabel(maxColumns - 1)}1`, adr('A1')).ast as CellReferenceAst
    const maxColumnPlusOneAst = parser.parse(`=${columnIndexToLabel(maxColumns)}1`, adr('A1')).ast as ErrorWithRawInputAst

    expect(maxColumnAst.type).toEqual(AstNodeType.CELL_REFERENCE)
    expect(maxColumnAst.reference.col).toEqual(maxColumns - 1)
    expect(maxColumnPlusOneAst.type).toEqual(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(maxColumnPlusOneAst.rawInput).toEqual(`${columnIndexToLabel(maxColumns)}1`)
    expect(maxColumnPlusOneAst.error).toEqual(new CellError(ErrorType.NAME))
  })

  it('cell range start beyond maximum column/row limit is #NAME', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)
    const maxRow = Config.defaultConfig.maxRows
    const maxColumns = Config.defaultConfig.maxColumns

    const ast1 = parser.parse(`=A${maxRow + 1}:B2`, adr('A1')).ast as ErrorWithRawInputAst
    const ast2 = parser.parse(`=${columnIndexToLabel(maxColumns)}1:B2`, adr('A1')).ast as ErrorWithRawInputAst

    expect(ast1.type).toEqual(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(ast1.rawInput).toEqual(`A${maxRow + 1}:B2`)
    expect(ast1.error).toEqual(new CellError(ErrorType.NAME))
    expect(ast2.type).toEqual(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(ast2.rawInput).toEqual(`${columnIndexToLabel(maxColumns)}1:B2`)
    expect(ast2.error).toEqual(new CellError(ErrorType.NAME))
  })

  it('cell range end beyond maximum column/row limit is #NAME', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = new ParserWithCaching(new Config(), sheetMapping.get)
    const maxRow = Config.defaultConfig.maxRows
    const maxColumns = Config.defaultConfig.maxColumns

    const ast1 = parser.parse(`=A1:B${maxRow + 1}`, adr('A1')).ast as ErrorWithRawInputAst
    const ast2 = parser.parse(`=A1:${columnIndexToLabel(maxColumns)}1`, adr('A1')).ast as ErrorWithRawInputAst

    expect(ast1.type).toEqual(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(ast1.rawInput).toEqual(`A1:B${maxRow + 1}`)
    expect(ast1.error).toEqual(new CellError(ErrorType.NAME))
    expect(ast2.type).toEqual(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(ast2.rawInput).toEqual(`A1:${columnIndexToLabel(maxColumns)}1`)
    expect(ast2.error).toEqual(new CellError(ErrorType.NAME))
  })
})

describe('Column ranges', () => {
  const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
  sheetMapping.addSheet('Sheet1')
  sheetMapping.addSheet('Sheet2')
  const parser = new ParserWithCaching(new Config(), sheetMapping.get)

  it('column range', () => {
    const ast = parser.parse('=C:D', adr('A1')).ast as ColumnRangeAst
    expect(ast.type).toEqual(AstNodeType.COLUMN_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.RELATIVE)
    expect(ast.start).toEqual(ColumnAddress.relative(null, 2))
    expect(ast.end).toEqual(ColumnAddress.relative(null, 3))
  })

  it('column range with sheet absolute', () => {
    const ast = parser.parse('=Sheet1!C:D', adr('A1')).ast as ColumnRangeAst
    expect(ast.type).toEqual(AstNodeType.COLUMN_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.START_ABSOLUTE)
    expect(ast.start).toEqual(ColumnAddress.relative(0, 2))
    expect(ast.end).toEqual(ColumnAddress.relative(0, 3))
  })

  it('column range with both sheets absolute - same sheet', () => {
    const ast = parser.parse('=Sheet1!C:Sheet1!D', adr('A1')).ast as ColumnRangeAst
    expect(ast.type).toEqual(AstNodeType.COLUMN_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.BOTH_ABSOLUTE)
    expect(ast.start).toEqual(ColumnAddress.relative(0, 2))
    expect(ast.end).toEqual(ColumnAddress.relative(0, 3))
  })

  it('column range with both sheets absolute - different sheet', () => {
    const ast = parser.parse('=Sheet1!C:Sheet2!D', adr('A1')).ast as ColumnRangeAst
    expect(ast.type).toEqual(AstNodeType.COLUMN_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.BOTH_ABSOLUTE)
    expect(ast.start).toEqual(ColumnAddress.relative(0, 2))
    expect(ast.end).toEqual(ColumnAddress.relative(1, 3))
  })

  it('column range with absolute column address', () => {
    const ast = parser.parse('=$C:D', adr('A1')).ast as ColumnRangeAst
    expect(ast.type).toEqual(AstNodeType.COLUMN_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.RELATIVE)
    expect(ast.start).toEqual(ColumnAddress.absolute(null, 2))
    expect(ast.end).toEqual(ColumnAddress.relative(null, 3))
  })

  it('column range with absolute sheet only on end side is a parsing error', () => {
    const { errors } = parser.parse('=A:Sheet2!B', adr('A1'))
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })

  it('column range beyond size limits is #NAME', () => {
    const maxColumns = Config.defaultConfig.maxColumns
    const a = columnIndexToLabel(maxColumns)
    const ast1 = parser.parse(`=A:${columnIndexToLabel(maxColumns - 1)}`, adr('A1')).ast as ColumnRangeAst
    const ast2 = parser.parse(`=A:${columnIndexToLabel(maxColumns)}`, adr('A1')).ast as ErrorWithRawInputAst
    const ast3 = parser.parse(`=${columnIndexToLabel(maxColumns)}:B`, adr('A1')).ast as ErrorWithRawInputAst

    expect(ast1.type).toEqual(AstNodeType.COLUMN_RANGE)
    expect(ast2.type).toEqual(AstNodeType.ERROR)
    expect(ast2.error).toEqual(new CellError(ErrorType.NAME))
    expect(ast3.type).toEqual(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(ast3.rawInput).toEqual(`${columnIndexToLabel(maxColumns)}:B`)
    expect(ast3.error).toEqual(new CellError(ErrorType.NAME))
  })
})

describe('Row ranges', () => {
  const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
  sheetMapping.addSheet('Sheet1')
  sheetMapping.addSheet('Sheet2')
  const parser = new ParserWithCaching(new Config(), sheetMapping.get)

  it('row range', () => {
    const ast = parser.parse('=3:4', adr('A1')).ast as RowRangeAst
    expect(ast.type).toEqual(AstNodeType.ROW_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.RELATIVE)
    expect(ast.start).toEqual(RowAddress.relative(null, 2))
    expect(ast.end).toEqual(RowAddress.relative(null, 3))
  })

  it('row range with sheet absolute', () => {
    const ast = parser.parse('=Sheet1!3:4', adr('A1')).ast as RowRangeAst
    expect(ast.type).toEqual(AstNodeType.ROW_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.START_ABSOLUTE)
    expect(ast.start).toEqual(RowAddress.relative(0, 2))
    expect(ast.end).toEqual(RowAddress.relative(0, 3))
  })

  it('row range with both sheets absolute - same sheet', () => {
    const ast = parser.parse('=Sheet1!3:Sheet1!4', adr('A1')).ast as RowRangeAst
    expect(ast.type).toEqual(AstNodeType.ROW_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.BOTH_ABSOLUTE)
    expect(ast.start).toEqual(RowAddress.relative(0, 2))
    expect(ast.end).toEqual(RowAddress.relative(0, 3))
  })

  it('row range with both sheets absolute - different sheet', () => {
    const ast = parser.parse('=Sheet1!3:Sheet2!4', adr('A1')).ast as RowRangeAst
    expect(ast.type).toEqual(AstNodeType.ROW_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.BOTH_ABSOLUTE)
    expect(ast.start).toEqual(RowAddress.relative(0, 2))
    expect(ast.end).toEqual(RowAddress.relative(1, 3))
  })

  it('row range with absolute row address', () => {
    const ast = parser.parse('=$3:4', adr('A1')).ast as RowRangeAst
    expect(ast.type).toEqual(AstNodeType.ROW_RANGE)
    expect(ast.sheetReferenceType).toEqual(RangeSheetReferenceType.RELATIVE)
    expect(ast.start).toEqual(RowAddress.absolute(null, 2))
    expect(ast.end).toEqual(RowAddress.relative(null, 3))
  })

  it('row range with absolute sheet only on end side is a parsing error', () => {
    const { errors } = parser.parse('=1:Sheet2!2', adr('A1'))
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })
})

describe('Parsing errors', () => {
  it('errors - lexing errors', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const input = ["='foo'", "=foo'bar", "=''''''", '=@']

    input.forEach((formula) => {
      const { ast, errors } = parser.parse(formula, simpleCellAddress(0, 0, 0))
      expect(ast.type).toBe(AstNodeType.ERROR)
      expect(errors[0].type).toBe(ParsingErrorType.LexingError)
    })
  })

  it('parsing error - column name without whole range', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const { ast, errors } = parser.parse('=A', simpleCellAddress(0, 0, 0))
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(errors[0].type).toBe(ParsingErrorType.LexingError)
  })

  it('parsing error - column name in procedure without whole range', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const { errors } = parser.parse('=SUM(A)', simpleCellAddress(0, 0, 0))
    expect(errors[0].type).toBe(ParsingErrorType.LexingError)
  })

  it('parsing error - not all input parsed', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const { errors } = parser.parse('=A1B1', simpleCellAddress(0, 0, 0))
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })

  it('unknown error literal', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(buildTranslationPackage(enGB)).get)

    const { ast, errors } = parser.parse('=#FOO!', simpleCellAddress(0, 0, 0))
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })
})
