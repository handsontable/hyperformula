import {CellContent, CellContentParser} from '../src/CellContentParser'

describe('CellContentParser', () => {
  const cellContentParser = new CellContentParser()

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
    expect(cellContentParser.parse(' 42')).toStrictEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('42 ')).toStrictEqual(new CellContent.Number(42))
    expect(cellContentParser.parse('42.13')).toStrictEqual(new CellContent.Number(42.13))
    expect(cellContentParser.parse('-42.13')).toStrictEqual(new CellContent.Number(-42.13))
  })

  it('string', () => {
    expect(cellContentParser.parse('f42')).toStrictEqual(new CellContent.String('f42'))
    expect(cellContentParser.parse('42f')).toStrictEqual(new CellContent.String('42f'))
    expect(cellContentParser.parse(' =FOO()')).toStrictEqual(new CellContent.String(' =FOO()'))
    expect(cellContentParser.parse(' ')).toStrictEqual(new CellContent.String(' '))
    expect(cellContentParser.parse('')).toStrictEqual(new CellContent.String(''))
  })
})
