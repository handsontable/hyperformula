import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function REPT', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const engine = HyperFormula.buildFromArray([
      ['=REPT()'],
      ['=REPT("foo")'],
      ['=REPT("foo", 1, 2)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
  })

  it('should return VALUE when wrong type of second parameter', () => {
    const engine = HyperFormula.buildFromArray([
      ['=REPT("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, 'Value cannot be coerced to number.'))
  })

  it('should return VALUE when second parameter is less than 0', () => {
    const engine = HyperFormula.buildFromArray([
      ['=REPT("foo", -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=REPT("foo", 0)'],
      ['=REPT("foo", 3)'],
      ['=REPT(1, 5)'],
      ['=REPT(, 5)'],
      ['=REPT("Na", 7)&" Batman!"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('A2'))).toEqual('foofoofoo')
    expect(engine.getCellValue(adr('A3'))).toEqual('11111')
    expect(engine.getCellValue(adr('A4'))).toEqual('')
    expect(engine.getCellValue(adr('A5'))).toEqual('NaNaNaNaNaNaNa Batman!')
  })

  it('should coerce other types to string', () => {
    const engine = HyperFormula.buildFromArray([
      ['=REPT(1, 1)'],
      ['=REPT(5+5, 1)'],
      ['=REPT(TRUE(), 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('10')
    expect(engine.getCellValue(adr('A3'))).toEqual('TRUE')
  })
})
