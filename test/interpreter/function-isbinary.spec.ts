import {HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('Function ISBINARY', () => {
  it('should return true for binary numbers', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ISBINARY("1010")', '=ISBINARY(1001)', '=ISBINARY(010)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
  })

  it('should return false otherwise', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ISBINARY("foo")', '=ISBINARY(123)', '=ISBINARY(TRUE())']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
  })
})