import {EmptyValue} from '../src'
import {ErrorType} from '../src/Cell'
import {CellContent, CellContentParser} from '../src/CellContentParser'
import {Config} from '../src/Config'
import {DateHelper} from '../src/DateHelper'
import {NumberLiteralHelper} from '../src/NumberLiteralHelper'

describe('CellContentParser', () => {
  const config = new Config()
  const cellContentParser = new CellContentParser(config, new DateHelper(config), new NumberLiteralHelper(config))

  it('a matrix', () => {
    expect(cellContentParser.parse('{=FOO()}')).toStrictEqual(new CellContent.MatrixFormula('=FOO()'))
  })

  it('not a matrix', () => {
    expect(cellContentParser.parse('{=FOO()')).not.toBeInstanceOf(CellContent.MatrixFormula)
    expect(cellContentParser.parse('=FOO()}')).not.toStrictEqual(CellContent.MatrixFormula)
  })

  it('a formula', () => {
    expect(cellContentParser.parse('=FOO()')).toStrictEqual(new CellContent.Formula('=FOO()'))
  })

  it('null is empty value', () => {
    expect(cellContentParser.parse(null)).toStrictEqual(new CellContent.Empty())
  })

  it('undefined is empty value', () => {
    expect(cellContentParser.parse(undefined)).toStrictEqual(new CellContent.Empty())
  })

  it('numbers', () => {
    expect(cellContentParser.parse('42')).toStrictEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('+42')).toStrictEqual(new CellContent.Number(42))
    expect(cellContentParser.parse(' 42')).toStrictEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('42 ')).toStrictEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('42.13')).toStrictEqual(new CellContent.Number(42.13))
    expect(cellContentParser.parse('-42.13')).toStrictEqual(new CellContent.Number(-42.13))
    expect(cellContentParser.parse('+42.13')).toStrictEqual(new CellContent.Number(42.13))
    expect(cellContentParser.parse('.13')).toStrictEqual(new CellContent.Number(0.13))
  })

  it( 'boolean', () => {
    expect(cellContentParser.parse('true')).toStrictEqual(new CellContent.Boolean(true))
    expect(cellContentParser.parse('false')).toStrictEqual(new CellContent.Boolean(false))
    expect(cellContentParser.parse('TRUE')).toStrictEqual(new CellContent.Boolean(true))
    expect(cellContentParser.parse('FALSE')).toStrictEqual(new CellContent.Boolean(false))
    expect(cellContentParser.parse('TrUe')).toStrictEqual(new CellContent.Boolean(true))
    expect(cellContentParser.parse('faLSE')).toStrictEqual(new CellContent.Boolean(false))
  })

  it('numbers with different decimal separators', () => {
    const config = new Config({ decimalSeparator: ',', functionArgSeparator: ';' })
    const cellContentParser = new CellContentParser(config, new DateHelper(config), new NumberLiteralHelper(config))

    expect(cellContentParser.parse('42')).toStrictEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('42,13')).toStrictEqual(new CellContent.Number(42.13))
    expect(cellContentParser.parse('-42,13')).toStrictEqual(new CellContent.Number(-42.13))
    expect(cellContentParser.parse('+42,13')).toStrictEqual(new CellContent.Number(42.13))
    expect(cellContentParser.parse(',13')).toStrictEqual(new CellContent.Number(0.13))
    expect(cellContentParser.parse('42.13')).toStrictEqual(new CellContent.String('42.13'))
    expect(cellContentParser.parse('12,34,56')).toStrictEqual(new CellContent.String('12,34,56'))
  })

  it('numbers with thousand separators', () => {
    const config = new Config({ thousandSeparator: ' ', functionArgSeparator: ';' })
    const cellContentParser = new CellContentParser(config, new DateHelper(config), new NumberLiteralHelper(config))

    expect(cellContentParser.parse('42')).toStrictEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('1234567')).toStrictEqual(new CellContent.Number(1234567))
    expect(cellContentParser.parse('1 234 567')).toStrictEqual(new CellContent.Number(1234567))
    expect(cellContentParser.parse('-1 234 567')).toStrictEqual(new CellContent.Number(-1234567))
    expect(cellContentParser.parse('1234 567')).toStrictEqual(new CellContent.Number(1234567))
    expect(cellContentParser.parse('12 3456 789')).toStrictEqual(new CellContent.Number(123456789))
    expect(cellContentParser.parse('1 234 567.12')).toStrictEqual(new CellContent.Number(1234567.12))
    expect(cellContentParser.parse('12 34 56 7')).toStrictEqual(new CellContent.String('12 34 56 7'))
    expect(cellContentParser.parse('1 234.12.12')).toStrictEqual(new CellContent.String('1 234.12.12'))
  })

  it( 'non-string', () => {
    expect(cellContentParser.parse(42)).toStrictEqual(new CellContent.Number(42))
    expect(cellContentParser.parse(true)).toStrictEqual(new CellContent.Boolean(true))
    expect(cellContentParser.parse(EmptyValue)).toStrictEqual(new CellContent.Empty())
    expect(cellContentParser.parse(-0)).toStrictEqual(new CellContent.Number(0))
    expect(cellContentParser.parse(Infinity)).toStrictEqual(new CellContent.Error(ErrorType.NUM))
    expect(cellContentParser.parse(-Infinity)).toStrictEqual(new CellContent.Error(ErrorType.NUM))
    expect(cellContentParser.parse(NaN)).toStrictEqual(new CellContent.Error(ErrorType.NUM))
  })

  it('string', () => {
    expect(cellContentParser.parse('f42')).toStrictEqual(new CellContent.String('f42'))
    expect(cellContentParser.parse('42f')).toStrictEqual(new CellContent.String('42f'))
    expect(cellContentParser.parse(' =FOO()')).toStrictEqual(new CellContent.String(' =FOO()'))
    expect(cellContentParser.parse(' ')).toStrictEqual(new CellContent.String(' '))
    expect(cellContentParser.parse('')).toStrictEqual(new CellContent.String(''))
  })

  it('errors', () => {
    expect(cellContentParser.parse('#DIV/0!')).toStrictEqual(new CellContent.Error(ErrorType.DIV_BY_ZERO))
    expect(cellContentParser.parse('#NUM!')).toStrictEqual(new CellContent.Error(ErrorType.NUM))
    expect(cellContentParser.parse('#N/A')).toStrictEqual(new CellContent.Error(ErrorType.NA))
    expect(cellContentParser.parse('#VALUE!')).toStrictEqual(new CellContent.Error(ErrorType.VALUE))
    expect(cellContentParser.parse('#CYCLE!')).toStrictEqual(new CellContent.Error(ErrorType.CYCLE))
    expect(cellContentParser.parse('#NAME?')).toStrictEqual(new CellContent.Error(ErrorType.NAME))
    expect(cellContentParser.parse('#REF!')).toStrictEqual(new CellContent.Error(ErrorType.REF))
  })

  it('errors are case insensitive', () => {
    expect(cellContentParser.parse('#dIv/0!')).toStrictEqual(new CellContent.Error(ErrorType.DIV_BY_ZERO))
  })

  it('error-like literal is string', () => {
    expect(cellContentParser.parse('#FOO!')).toStrictEqual(new CellContent.String('#FOO!'))
  })

  it('date parsing', () => {
    expect(cellContentParser.parse('02-02-2020')).toStrictEqual(new CellContent.Number(43863))
    expect(cellContentParser.parse('  02-02-2020')).toStrictEqual(new CellContent.Number(43863))
  })

  it('JS Date parsing', () => {
    expect(cellContentParser.parse(new Date(1995, 11, 17))).toStrictEqual(new CellContent.Number(35050))
    expect(cellContentParser.parse(new Date('02-02-2020'))).toStrictEqual(new CellContent.Number(43863))
  })

  it( 'starts with \'', () => {
    expect(cellContentParser.parse('\'123')).toStrictEqual(new CellContent.String('123'))
    expect(cellContentParser.parse('\'=1+1')).toStrictEqual(new CellContent.String('=1+1'))
    expect(cellContentParser.parse('\'\'1')).toStrictEqual(new CellContent.String('\'1'))
    expect(cellContentParser.parse('\' 1')).toStrictEqual(new CellContent.String(' 1'))
    expect(cellContentParser.parse(' \'1')).toStrictEqual(new CellContent.String(' \'1'))
    expect(cellContentParser.parse('\'02-02-2020')).toStrictEqual(new CellContent.String('02-02-2020'))
  })
})
