import {CellValueDetailedType, HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('When value is prepend with an apostrophe', () => {
  it('treats numeric value as a string', () => {
    const engine = HyperFormula.buildFromArray([
      ["'001572"],
      ['=A1']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('001572')
    expect(engine.getCellValue(adr('A2'))).toEqual('001572')
    expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(CellValueDetailedType.STRING)
  })
})
