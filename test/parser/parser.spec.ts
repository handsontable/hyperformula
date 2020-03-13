import {buildConfig} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {SheetMapping} from '../../src/DependencyGraph'
import {enGB, plPL} from '../../src/i18n'
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
  StringAst,
} from '../../src/parser'
import {ParenthesisAst} from '../../src/parser/Ast'

describe('ParserWithCaching', () => {
  it('integer literal', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=42', CellAddress.absolute(0, 0, 0)).ast as NumberAst
    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(42)
  })

  it('negative integer literal', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=-42', CellAddress.absolute(0, 0, 0)).ast as MinusUnaryOpAst
    expect(ast.type).toBe(AstNodeType.MINUS_UNARY_OP)
    const value = ast.value as NumberAst
    expect(value.type).toBe(AstNodeType.NUMBER)
    expect(value.value).toBe(42)
  })

  it('string literal', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('="foobar"', CellAddress.absolute(0, 0, 0)).ast as StringAst
    expect(ast.type).toBe(AstNodeType.STRING)
    expect(ast.value).toBe('foobar')
  })

  it('plus operator on different nodes', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=1+A5', CellAddress.absolute(0, 0, 0)).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.CELL_REFERENCE)
  })

  it('minus operator', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=1-3', CellAddress.absolute(0, 0, 0)).ast as MinusOpAst
    expect(ast.type).toBe(AstNodeType.MINUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it('power operator', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=2^3', CellAddress.absolute(0, 0, 0)).ast as PowerOpAst
    expect(ast.type).toBe(AstNodeType.POWER_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it('power operator order', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=2*2^3', CellAddress.absolute(0, 0, 0)).ast as PowerOpAst
    expect(ast.type).toBe(AstNodeType.TIMES_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.POWER_OP)
  })

  it('SUM function without args', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=SUM()', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
    expect(ast.args.length).toBe(0)
  })

  it('function without polish characters', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=żółćąęźśńŻÓŁĆĄĘŹŚŃ()', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('ŻÓŁĆĄĘŹŚŃŻÓŁĆĄĘŹŚŃ')
    expect(ast.args.length).toBe(0)
  })

  it('function with dot separator', () => {
    const parser = new ParserWithCaching(buildConfig({ language: plPL }), new SheetMapping(plPL).get)
    const ast = parser.parse('=NR.SER.OST.DN.MIEŚ()', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('EOMONTH')
    expect(ast.args.length).toBe(0)
  })

  it('function name should be translated during parsing', () => {
    const parser = new ParserWithCaching(buildConfig({ language: plPL }), new SheetMapping(plPL).get)
    const ast = parser.parse('=SUMA()', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
    expect(ast.args.length).toBe(0)
  })

  it('function with number', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=DEC2BIN(4)', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toEqual('DEC2BIN')
  })

  it('should leave original name if procedure translation not known', () => {
    const parser = new ParserWithCaching(buildConfig({ language: plPL }), new SheetMapping(plPL).get)
    const ast = parser.parse('=FOOBAR()', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('FOOBAR')
    expect(ast.args.length).toBe(0)
  })

  it('SUM function with args', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=SUM(1, A1)', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
    expect(ast.args[0].type).toBe(AstNodeType.NUMBER)
    expect(ast.args[1].type).toBe(AstNodeType.CELL_REFERENCE)
  })

  it('SUM function with expression arg', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=SUM(1 / 2 + SUM(1,2))', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.args.length).toBe(1)
    expect(ast.args[0].type).toBe(AstNodeType.PLUS_OP)

    const arg = ast.args[0] as PlusOpAst
    expect(arg.left.type).toBe(AstNodeType.DIV_OP)
    expect(arg.right.type).toBe(AstNodeType.FUNCTION_CALL)
  })

  it('joining nodes without braces', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=1 + 2 + 3', CellAddress.absolute(0, 0, 0)).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it('joining nodes with braces', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=1 + (2 + 3)', CellAddress.absolute(0, 0, 0)).ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)

    const right = ast.right as ParenthesisAst
    expect(right.type).toBe(AstNodeType.PARENTHESIS)
    expect(right.expression.type).toBe(AstNodeType.PLUS_OP)
  })

  it('float literal', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=3.14', CellAddress.absolute(0, 0, 0)).ast as NumberAst
    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(3.14)
  })

  it('float literal with different decimal separator', () => {
    const parser = new ParserWithCaching(buildConfig({ decimalSeparator: ',', functionArgSeparator: ';' }), new SheetMapping(enGB).get)
    const ast1 = parser.parse('=3,14', CellAddress.absolute(0, 0, 0)).ast as NumberAst
    const ast2 = parser.parse('=03,14', CellAddress.absolute(0, 0, 0)).ast as NumberAst
    const ast3 = parser.parse('=,14', CellAddress.absolute(0, 0, 0)).ast as NumberAst

    expect(ast1.type).toBe(AstNodeType.NUMBER)
    expect(ast1.value).toBe(3.14)
    expect(ast2.type).toBe(AstNodeType.NUMBER)
    expect(ast2.value).toBe(3.14)
    expect(ast3.type).toBe(AstNodeType.NUMBER)
    expect(ast3.value).toBe(0.14)
  })

  it('leading zeros of number literals', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const int = parser.parse('=01234', CellAddress.absolute(0, 0, 0)).ast as NumberAst
    const float = parser.parse('=03.14', CellAddress.absolute(0, 0, 0)).ast as NumberAst
    expect(int.type).toBe(AstNodeType.NUMBER)
    expect(int.value).toBe(1234)
    expect(float.type).toBe(AstNodeType.NUMBER)
    expect(float.value).toBe(3.14)
  })

  it('functions should not be case sensitive', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const ast = parser.parse('=sum(1)', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe('SUM')
  })

  it('allow to accept different lexer configs', () => {
    const parser1 = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)
    const parser2 = new ParserWithCaching(buildConfig({ functionArgSeparator: ';' }), new SheetMapping(enGB).get)

    const ast1 = parser1.parse('=SUM(1, 2)', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    const ast2 = parser2.parse('=SUM(1; 2)', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst

    expect(ast1.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast2.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast1).toEqual(ast2)
  })

  it('error literal', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=#REF!', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error).toEqual(new CellError(ErrorType.REF))
  })

  it('error literals are case insensitive', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=#rEf!', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error).toEqual(new CellError(ErrorType.REF))
  })
})

describe('cell references and ranges', () => {
  it('absolute cell reference', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=$B$3', CellAddress.absolute(0, 1, 1)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.absolute(0, 1, 2))
  })

  it('relative cell reference', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=B3', CellAddress.absolute(0, 1, 1)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.relative(0, 0, 1))
  })

  it('absolute column cell reference', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=$B3', CellAddress.absolute(0, 1, 1)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.absoluteCol(0, 1, 1))
  })

  it('absolute row cell reference', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=B$3', CellAddress.absolute(0, 1, 1)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference).toEqual(CellAddress.absoluteRow(0, 0, 2))
  })

  it('cell references should not be case sensitive', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=d1', CellAddress.absolute(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.col).toBe(3)
    expect(ast.reference.row).toBe(0)
  })

  it('cell reference by default has sheet from the sheet it is written', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse('=D1', CellAddress.absolute(1, 0, 0)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
    expect(ast.reference.col).toBe(3)
    expect(ast.reference.row).toBe(0)
  })

  it('cell reference with sheet name', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!D1', CellAddress.absolute(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
    expect(ast.reference.col).toBe(3)
    expect(ast.reference.row).toBe(0)
  })

  // incompatibility with product 1
  it('using unknown sheet gives REF', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=Sheet2!A1', CellAddress.absolute(0, 0, 0)).ast as ErrorAst

    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error).toEqual(new CellError(ErrorType.REF))
  })

  it('sheet name with other characters', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet_zażółć_gęślą_jaźń')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse('=Sheet_zażółć_gęślą_jaźń!A1', CellAddress.absolute(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name is case insensitive', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse('=shEEt2!A1', CellAddress.absolute(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name with spaces', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet with spaces')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse("='Sheet with spaces'!A1", CellAddress.absolute(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('sheet name inside quotes', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse("='Sheet2'!A1", CellAddress.absolute(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  xit('escaping support', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet("Some'sheet")
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse("='Some''sheet'!A1", CellAddress.absolute(0, 0, 0)).ast as CellReferenceAst
    expect(ast.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.reference.sheet).toBe(1)
  })

  it('simple cell range', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const ast = parser.parse('=A1:B2', CellAddress.absolute(0, 0, 0)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
  })

  it('cell range with both start and end sheets specified', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!A1:Sheet2!B2', CellAddress.absolute(0, 0, 0)).ast as CellRangeAst

    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start.sheet).toEqual(1)
    expect(ast.end.sheet).toEqual(1)
  })

  it('cell range may have only sheet specified in start address', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!A1:B2', CellAddress.absolute(0, 0, 0)).ast as CellRangeAst

    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start.sheet).toEqual(1)
    expect(ast.end.sheet).toEqual(1)
  })

  it('cell range with different start and end sheets', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    sheetMapping.addSheet('Sheet3')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const ast = parser.parse('=Sheet2!A1:Sheet3!B2', CellAddress.absolute(0, 0, 0)).ast as CellRangeAst

    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast.start.sheet).toEqual(1)
    expect(ast.end.sheet).toEqual(2)
  })
})


describe('Parsing errors', () => {
  it('errors - lexing errors', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const input = ["='foo'", "=foo'bar", "=''''''", '=@']

    input.forEach((formula) => {
      const { ast, errors } = parser.parse(formula, CellAddress.absolute(0, 0, 0))
      expect(ast.type).toBe(AstNodeType.ERROR)
      expect(errors[0].type).toBe(ParsingErrorType.LexingError)
    })
  })

  it('lexing error - unexpected token', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const { ast, errors } = parser.parse('=A', CellAddress.absolute(0, 0, 0))
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(errors[0].type).toBe(ParsingErrorType.LexingError)
    expect(errors[0].message).toMatch(/unexpected character/)
  })

  it('lexing error - unexpected token', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ast, errors } = parser.parse('=SUM(A)', CellAddress.absolute(0, 0, 0))
    expect(errors[0].type).toBe(ParsingErrorType.LexingError)
    expect(errors[0].message).toMatch(/unexpected character/)

  })

  it('parsing error - not all input parsed', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const { errors } = parser.parse('=A1B1', CellAddress.absolute(0, 0, 0))
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })

  it('unknown error literal', () => {
    const parser = new ParserWithCaching(buildConfig(), new SheetMapping(enGB).get)

    const { ast, errors } = parser.parse('=#FOO!', CellAddress.absolute(0, 0, 0))
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(errors[0].type).toBe(ParsingErrorType.ParserError)
  })

  // weird error
  it('cell range with unexisting end sheet', () => {
    const sheetMapping = new SheetMapping(enGB)
    sheetMapping.addSheet('Sheet1')
    sheetMapping.addSheet('Sheet2')
    const parser = new ParserWithCaching(buildConfig(), sheetMapping.get)

    const { ast, errors } = parser.parse('=Sheet2!A1:Sheet3!B2', CellAddress.absolute(0, 0, 0))

    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(errors[0].type).toBe(ParsingErrorType.RangeOffsetNotAllowed)
  })
})
