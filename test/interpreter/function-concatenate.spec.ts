import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('function CONCATENATE', () => {
  it('by default returns empty string', () => {
    const engine = HyperFormula.buildFromArray([['=CONCATENATE()']])

    expect(engine.getCellValue('A1')).toEqual('')
  })

  it('works', () => {
    const engine = HyperFormula.buildFromArray([['John', 'Smith', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue('C1')).toEqual('JohnSmith')
  })

  it('returns error if one of the arguments is error', () => {
    const engine = HyperFormula.buildFromArray([['John', '=1/0', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('empty value is empty string', () => {
    const engine = HyperFormula.buildFromArray([['foo', '', 'bar', '=CONCATENATE(A1, B1, C1)']])

    expect(engine.getCellValue('D1')).toEqual('foobar')
  })

  xit('supports range values', () => {
    const engine = HyperFormula.buildFromArray([
      ['foo', 'bar', 'baz', '=CONCATENATE(A1:C1)']
    ])

    expect(engine.getCellValue('D1')).toEqual('foobarbaz')
  })
})
