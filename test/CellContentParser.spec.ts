import {ErrorType} from '../src/Cell'
import {CellContent, CellContentParser} from '../src/CellContentParser'
import {Config} from '../src/Config'
import {DateTimeHelper} from '../src/DateTimeHelper'
import {NumberLiteralHelper} from '../src/NumberLiteralHelper'

describe('CellContentParser', () => {
  const config = new Config()
  const cellContentParser = new CellContentParser(config, new DateTimeHelper(config), new NumberLiteralHelper(config))

  it('a matrix', () => {
    expect(cellContentParser.parse('{=FOO()}')).toEqual(new CellContent.MatrixFormula('=FOO()'))
  })

  it('not a matrix', () => {
    expect(cellContentParser.parse('{=FOO()')).not.toBeInstanceOf(CellContent.MatrixFormula)
    expect(cellContentParser.parse('=FOO()}')).not.toEqual(CellContent.MatrixFormula)
  })

  it('a formula', () => {
    expect(cellContentParser.parse('=FOO()')).toEqual(new CellContent.Formula('=FOO()'))
  })

  it('null is empty value', () => {
    expect(cellContentParser.parse(null)).toEqual(new CellContent.Empty())
  })

  it('undefined is empty value', () => {
    expect(cellContentParser.parse(undefined)).toEqual(new CellContent.Empty())
  })

  it('numbers', () => {
    expect(cellContentParser.parse('42')).toEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('+42')).toEqual(new CellContent.Number(42))
    expect(cellContentParser.parse(' 42')).toEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('42 ')).toEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('42.13')).toEqual(new CellContent.Number(42.13))
    expect(cellContentParser.parse('-42.13')).toEqual(new CellContent.Number(-42.13))
    expect(cellContentParser.parse('+42.13')).toEqual(new CellContent.Number(42.13))
    expect(cellContentParser.parse('.13')).toEqual(new CellContent.Number(0.13))
  })

  it( 'boolean', () => {
    expect(cellContentParser.parse('true')).toEqual(new CellContent.Boolean(true))
    expect(cellContentParser.parse('false')).toEqual(new CellContent.Boolean(false))
    expect(cellContentParser.parse('TRUE')).toEqual(new CellContent.Boolean(true))
    expect(cellContentParser.parse('FALSE')).toEqual(new CellContent.Boolean(false))
    expect(cellContentParser.parse('TrUe')).toEqual(new CellContent.Boolean(true))
    expect(cellContentParser.parse('faLSE')).toEqual(new CellContent.Boolean(false))
  })

  it('numbers with different decimal separators', () => {
    const config = new Config({ decimalSeparator: ',', functionArgSeparator: ';' })
    const cellContentParser = new CellContentParser(config, new DateTimeHelper(config), new NumberLiteralHelper(config))

    expect(cellContentParser.parse('42')).toEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('42,13')).toEqual(new CellContent.Number(42.13))
    expect(cellContentParser.parse('-42,13')).toEqual(new CellContent.Number(-42.13))
    expect(cellContentParser.parse('+42,13')).toEqual(new CellContent.Number(42.13))
    expect(cellContentParser.parse(',13')).toEqual(new CellContent.Number(0.13))
    expect(cellContentParser.parse('42.13')).toEqual(new CellContent.String('42.13'))
    expect(cellContentParser.parse('12,34,56')).toEqual(new CellContent.String('12,34,56'))
  })

  it('numbers with thousand separators', () => {
    const config = new Config({ thousandSeparator: ' ', functionArgSeparator: ';' })
    const cellContentParser = new CellContentParser(config, new DateTimeHelper(config), new NumberLiteralHelper(config))

    expect(cellContentParser.parse('42')).toEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('1234567')).toEqual(new CellContent.Number(1234567))
    expect(cellContentParser.parse('1 234 567')).toEqual(new CellContent.Number(1234567))
    expect(cellContentParser.parse('-1 234 567')).toEqual(new CellContent.Number(-1234567))
    expect(cellContentParser.parse('1234 567')).toEqual(new CellContent.Number(1234567))
    expect(cellContentParser.parse('12 3456 789')).toEqual(new CellContent.Number(123456789))
    expect(cellContentParser.parse('1 234 567.12')).toEqual(new CellContent.Number(1234567.12))
    expect(cellContentParser.parse('12 34 56 7')).toEqual(new CellContent.String('12 34 56 7'))
    expect(cellContentParser.parse('1 234.12.12')).toEqual(new CellContent.String('1 234.12.12'))
  })

  it( 'non-string', () => {
    expect(cellContentParser.parse(42)).toEqual(new CellContent.Number(42))
    expect(cellContentParser.parse(true)).toEqual(new CellContent.Boolean(true))
    expect(cellContentParser.parse(null)).toEqual(new CellContent.Empty())
    expect(cellContentParser.parse(undefined)).toEqual(new CellContent.Empty())
    expect(cellContentParser.parse(-0)).toEqual(new CellContent.Number(0))
    expect(cellContentParser.parse(Infinity)).toEqual(new CellContent.Error(ErrorType.NUM))
    expect(cellContentParser.parse(-Infinity)).toEqual(new CellContent.Error(ErrorType.NUM))
    expect(cellContentParser.parse(NaN)).toEqual(new CellContent.Error(ErrorType.NUM))
  })

  it('string', () => {
    expect(cellContentParser.parse('f42')).toEqual(new CellContent.String('f42'))
    expect(cellContentParser.parse('42f')).toEqual(new CellContent.String('42f'))
    expect(cellContentParser.parse(' =FOO()')).toEqual(new CellContent.String(' =FOO()'))
    expect(cellContentParser.parse(' ')).toEqual(new CellContent.String(' '))
    expect(cellContentParser.parse('')).toEqual(new CellContent.String(''))
  })

  it('errors', () => {
    expect(cellContentParser.parse('#DIV/0!')).toEqual(new CellContent.Error(ErrorType.DIV_BY_ZERO))
    expect(cellContentParser.parse('#NUM!')).toEqual(new CellContent.Error(ErrorType.NUM))
    expect(cellContentParser.parse('#N/A')).toEqual(new CellContent.Error(ErrorType.NA))
    expect(cellContentParser.parse('#VALUE!')).toEqual(new CellContent.Error(ErrorType.VALUE))
    expect(cellContentParser.parse('#CYCLE!')).toEqual(new CellContent.Error(ErrorType.CYCLE))
    expect(cellContentParser.parse('#NAME?')).toEqual(new CellContent.Error(ErrorType.NAME))
    expect(cellContentParser.parse('#REF!')).toEqual(new CellContent.Error(ErrorType.REF))
  })

  it('errors are case insensitive', () => {
    expect(cellContentParser.parse('#dIv/0!')).toEqual(new CellContent.Error(ErrorType.DIV_BY_ZERO))
  })

  it('error-like literal is string', () => {
    expect(cellContentParser.parse('#FOO!')).toEqual(new CellContent.String('#FOO!'))
  })

  it('date parsing', () => {
    expect(cellContentParser.parse('02-02-2020')).toEqual(new CellContent.Number(43863))
    expect(cellContentParser.parse('  02-02-2020')).toEqual(new CellContent.Number(43863))
  })

  it('JS Date parsing', () => {
    expect(cellContentParser.parse(new Date(1995, 11, 17))).toEqual(new CellContent.Number(35050))
  })

  it( 'starts with \'', () => {
    expect(cellContentParser.parse('\'123')).toEqual(new CellContent.String('123'))
    expect(cellContentParser.parse('\'=1+1')).toEqual(new CellContent.String('=1+1'))
    expect(cellContentParser.parse('\'\'1')).toEqual(new CellContent.String('\'1'))
    expect(cellContentParser.parse('\' 1')).toEqual(new CellContent.String(' 1'))
    expect(cellContentParser.parse(' \'1')).toEqual(new CellContent.String(' \'1'))
    expect(cellContentParser.parse('\'02-02-2020')).toEqual(new CellContent.String('02-02-2020'))
  })
})
