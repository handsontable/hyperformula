import {HyperFormula} from '../../src'
import {Config} from '../../src/Config'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage} from '../../src/i18n'
import {enGB, plPL} from '../../src/i18n/languages'
import {NamedExpressions} from '../../src/NamedExpressions'
import {AstNodeType, buildLexerConfig, Unparser} from '../../src/parser'
import {adr, unregisterAllLanguages} from '../testUtils'
import {buildEmptyParserWithCaching} from './common'

describe('Unparse', () => {
  const config = new Config()
  const lexerConfig = buildLexerConfig(config)
  const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
  sheetMapping.addSheet('Sheet1')
  sheetMapping.addSheet('Sheet2')
  sheetMapping.addSheet('Sheet with spaces')
  sheetMapping.addSheet("Sheet'With'Quotes")
  const parser = buildEmptyParserWithCaching(config, sheetMapping)
  const namedExpressions = new NamedExpressions()
  const unparser = new Unparser(config, lexerConfig, sheetMapping.fetchDisplayName, namedExpressions)

  beforeEach(() => {
    unregisterAllLanguages()
    HyperFormula.registerLanguage(plPL.langCode, plPL)
    HyperFormula.registerLanguage(enGB.langCode, enGB)
  })

  it('#unparse', () => {
    const formula = '=1+SUM(1,2,3)*3'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))
    expect(unparsed).toEqual(formula)
  })

  it('#unparse simple addreess', () => {
    const formula = '=A1'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse simple addreess from other sheet', () => {
    const formula = '=Sheet1!A1'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse absolute col', () => {
    const formula = '=$A1'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse absolute row addreess', () => {
    const formula = '=A$1'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse absolute address', () => {
    const formula = '=$A$1'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse cell ref between strings', () => {
    const formula = '="A5"+A4+"A6"'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse cell ref in string with escape', () => {
    const formula = '="fdsaf\\"A5"'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse cell range from same sheet', () => {
    const formula = '=$A$1:B$2'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse cell range from other sheet', () => {
    const formula = '=Sheet1!$A$1:B$2'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse ops', () => {
    const formula = '=-1+1-1*1/1^1&1=1<>1<1<=1>1<1'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse with unspecified error', () => {
    const formula = '=1+'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=#ERROR!')
  })

  it('#unparse with known error', () => {
    const formula = '=#REF!'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=#REF!')
  })

  it('#unparse error with data input', () => {
    const formula = '=NotExistingSheet!A1'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(ast.type).toEqual(AstNodeType.ERROR_WITH_RAW_INPUT)
    expect(unparsed).toEqual('=NotExistingSheet!A1')
  })

  it('#unparse with known error with translation', () => {
    const config = new Config({language: 'plPL'})
    const parser = buildEmptyParserWithCaching(config, sheetMapping)
    const unparser = new Unparser(config, buildLexerConfig(config), sheetMapping.fetchDisplayName, new NamedExpressions())
    const formula = '=#ADR!'
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=#ADR!')
  })

  it('#unparse forgets about downcase', () => {
    const formula = '=sum(1,2,3)'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=SUM(1,2,3)')
  })

  it('#unparse should not forget about spaces', () => {
    const formula = '= 1 + sum( 1,2,   3) +A1 / 2 + bar'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('= 1 + SUM( 1,2,   3) +A1 / 2 + bar')
  })

  it('#unparse named expression', () => {
    const formula = '=true'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=true')
  })

  it('#unparse named expression returns original form', () => {
    const namedExpressions = new NamedExpressions()
    namedExpressions.addNamedExpression('SomeWEIRD_name', undefined)
    const unparser = new Unparser(config, lexerConfig, sheetMapping.fetchDisplayName, namedExpressions)
    const formula = '=someWeird_Name'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=SomeWEIRD_name')
  })

  it('#unparse named expression use local version if available', () => {
    const namedExpressions = new NamedExpressions()
    namedExpressions.addNamedExpression('SomeWEIRD_name', undefined)
    namedExpressions.addNamedExpression('SomeWEIRD_NAME', 0)
    const unparser = new Unparser(config, lexerConfig, sheetMapping.fetchDisplayName, namedExpressions)
    const formula = '=someWeird_Name'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=SomeWEIRD_NAME')
  })

  it('#unparse nonexisting named expression returns original input', () => {
    const namedExpressions = new NamedExpressions()
    const unparser = new Unparser(config, lexerConfig, sheetMapping.fetchDisplayName, namedExpressions)
    const formula = '=someWeird_Name'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=someWeird_Name')
  })

  it('#unparse nonexisting named expression returns original input when global named expression is removed', () => {
    const namedExpressions = new NamedExpressions()
    namedExpressions.addNamedExpression('SomeWEIRD_name', undefined)
    namedExpressions.remove('SomeWEIRD_name', undefined)
    const unparser = new Unparser(config, lexerConfig, sheetMapping.fetchDisplayName, namedExpressions)
    const formula = '=someWeird_Name'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=someWeird_Name')
  })

  it('#unparse forgets about OFFSET', () => {
    const formula = '=OFFSET(C3, 1, 1)'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=D4')
  })

  it('#unparse doesnt forget about unnecessary parenthesis', () => {
    const formula = '=(1+2)'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=(1+2)')
  })

  it('#unparse do not forgets about sheet reference', () => {
    const formula = '=Sheet1!C3'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=Sheet1!C3')
  })

  it('#unparse necessary parenthesis from left subtree', () => {
    const formula = '=(1+2)*3'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=(1+2)*3')
  })

  it('#unparse necessary parenthesis from right subtree', () => {
    const formula = '=3*(1+2)'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=3*(1+2)')
  })

  it('#unparse doesnt use parenthesis for the same operations', () => {
    const formula = '=4*3*2'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=4*3*2')
  })

  it('#unparse doesnt use parenthesis for different operations of same precedece', () => {
    const formula1 = '=4/3*2'
    const formula2 = '=4*3/2'
    const ast1 = parser.parse(formula1, adr('A1')).ast
    const ast2 = parser.parse(formula2, adr('A1')).ast

    const unparsed1 = unparser.unparse(ast1, adr('A1'))
    const unparsed2 = unparser.unparse(ast2, adr('A1'))

    expect(unparsed1).toEqual(formula1)
    expect(unparsed2).toEqual(formula2)
  })

  it('#unparse doesnt use parenthesis for functions or other non-operator node types', () => {
    const formula1 = '=TRUE()*2'
    const formula2 = '=2*TRUE()'
    const ast1 = parser.parse(formula1, adr('A1')).ast
    const ast2 = parser.parse(formula2, adr('A1')).ast

    const unparsed1 = unparser.unparse(ast1, adr('A1'))
    const unparsed2 = unparser.unparse(ast2, adr('A1'))

    expect(unparsed1).toEqual(formula1)
    expect(unparsed2).toEqual(formula2)
  })

  it('#unparse necessary parenthesis from subtree', () => {
    const formula = '=-(3+4)'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse double unary minus', () => {
    const formula = '=-(-(3+4))'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse doesnt use parenthesis for non-operator node types', () => {
    const formula = '=-42'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse percent', () => {
    const formula = '=42%'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse use language configuration', () => {
    const configEN = new Config({language: enGB.langCode})
    const configPL = new Config({language: plPL.langCode})

    const parser = buildEmptyParserWithCaching(configPL, sheetMapping)

    const unparserPL = new Unparser(configPL, buildLexerConfig(configPL), sheetMapping.fetchDisplayName, new NamedExpressions())
    const unparserEN = new Unparser(configEN, buildLexerConfig(configEN), sheetMapping.fetchDisplayName, new NamedExpressions())

    const formula = '=SUMA(1,2)'

    const ast = parser.parse(formula, adr('A1')).ast

    expect(unparserPL.unparse(ast, adr('A1'))).toEqual('=SUMA(1,2)')
    expect(unparserEN.unparse(ast, adr('A1'))).toEqual('=SUM(1,2)')
  })

  it('unparsing sheet names in references sometimes have to wrap in quotes', () => {
    const formula = "='Sheet with spaces'!A1"
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('unparsing sheet names in quotes should escape single quotes', () => {
    const formula = "='Sheet''With''Quotes'!A1"
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('unparsing sheet names in ranges sometimes have to wrap in quotes', () => {
    const formula = "='Sheet with spaces'!A1:B1"
    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1', 0))

    expect(unparsed).toEqual(formula)
  })

  it('unparsing sheet name always returns its original name', () => {
    const formula = '=shEET2!A1:B1'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1', 0))

    expect(unparsed).toEqual('=Sheet2!A1:B1')
  })

  it('unparsing range with sheet name on both sides', () => {
    const formula = '=Sheet1!A1:Sheet2!B1'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1', 0))

    expect(unparsed).toEqual('=Sheet1!A1:Sheet2!B1')
  })

  it('unparsing function without translation should unparse to canonical name', () => {
    const formula = '=FOOBAR(1,2,3)'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=FOOBAR(1,2,3)')
  })

  it('unparsing numbers with decimal separator', () => {
    const config = new Config({decimalSeparator: ',', functionArgSeparator: ';'})
    const lexerConfig = buildLexerConfig(config)
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    sheetMapping.addSheet('Sheet1')
    const parser = buildEmptyParserWithCaching(config, sheetMapping)
    const unparser = new Unparser(config, lexerConfig, sheetMapping.fetchDisplayName, new NamedExpressions())
    const formula = '=1+1234,567'

    const ast = parser.parse(formula, adr('A1')).ast
    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse column range', () => {
    const formula = '=A:B'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse absolute column range', () => {
    const formula = '=$A:B'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse column range from other sheet', () => {
    const formula = '=Sheet1!$A:B'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse column range from other sheet - both sides', () => {
    const formula = '=Sheet1!$A:Sheet1!B'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse row range', () => {
    const formula = '=1:2'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse absolute row range', () => {
    const formula = '=$1:2'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse row range from other sheet', () => {
    const formula = '=Sheet1!$1:2'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse row range from other sheet - both sides', () => {
    const formula = '=Sheet1!$1:Sheet1!2'
    const ast = parser.parse(formula, adr('A1', 1)).ast
    const unparsed = unparser.unparse(ast, adr('A1', 1))

    expect(unparsed).toEqual(formula)
  })
})

describe('whitespaces', () => {
  const config = new Config()
  const lexerConfig = buildLexerConfig(config)
  const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
  sheetMapping.addSheet('Sheet1')
  sheetMapping.addSheet('Sheet2')
  sheetMapping.addSheet('Sheet with spaces')
  const parser = buildEmptyParserWithCaching(config, sheetMapping)
  const unparser = new Unparser(config, lexerConfig, sheetMapping.fetchDisplayName, new NamedExpressions())

  it('should unparse with original whitespaces', () => {
    const formula = '= 1'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('should unparse string with original whitespaces', () => {
    const formula = '= "foo"'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('should unparse reference with original whitespaces', () => {
    const formula = '= A1+ Sheet2!A1'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('should unparse operators with original whitespaces', () => {
    const formula = '= - 1 + 2 - 3 / 4 * 5 ^ 6 %'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('should unparse ranges with leading whitespaces only', () => {
    const formula = '=  A1   :   A2'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=  A1:A2')
  })

  it('should unparse formula with leading and internal whitespace', () => {
    const formula = '=  SUM( A1,   A2   )'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('should forget about spaces before func args separator', () => {
    const formula = '=  SUM( A1   ,   A2   )'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual('=  SUM( A1,   A2   )')
  })

  it('should unparse parenthesis with leading and internal whitespace', () => {
    const formula = '=1 + ( A1 +   A2   )'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('should unparse error literals with leading whitespaces', () => {
    const formula = '= #DIV/0!'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('should unparse empty argument with whitespaces', () => {
    const formula = '=PV(1,2,3,   ,)'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })

  it('should unparse arrays with whitespaces', () => {
    const formula = '= {  1,   2;    3,     4   }'
    const ast = parser.parse(formula, adr('A1')).ast

    const unparsed = unparser.unparse(ast, adr('A1'))

    expect(unparsed).toEqual(formula)
  })
})
