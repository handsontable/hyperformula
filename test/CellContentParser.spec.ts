import {CellContentParser, CellContentType} from '../src/CellContentParser'

describe('CellContentParser', () => {
  const cellContentParser = new CellContentParser()

  it('a matrix', () => {
    expect(cellContentParser.parse('{=FOO()}')).toEqual(CellContentType.MATRIX_FORMULA)
  })

  it('not a matrix', () => {
    expect(cellContentParser.parse('{=FOO()')).not.toEqual(CellContentType.MATRIX_FORMULA)
    expect(cellContentParser.parse('=FOO()}')).not.toEqual(CellContentType.MATRIX_FORMULA)
  })

  it('a formula', () => {
    expect(cellContentParser.parse('=FOO()')).toEqual(CellContentType.FORMULA)
  })

  it('empty value', () => {
    expect(cellContentParser.parse('')).toEqual(CellContentType.EMPTY)
  })

  it('numbers', () => {
    expect(cellContentParser.parse('42')).toEqual(CellContentType.NUMBER)
    expect(cellContentParser.parse('42.13')).toEqual(CellContentType.NUMBER)
    expect(cellContentParser.parse('-42.13')).toEqual(CellContentType.NUMBER)
  })

  it('string', () => {
    expect(cellContentParser.parse('f42')).toEqual(CellContentType.STRING)
    expect(cellContentParser.parse('42f')).toEqual(CellContentType.STRING)
    expect(cellContentParser.parse(' =FOO()')).toEqual(CellContentType.STRING)
  })
})
