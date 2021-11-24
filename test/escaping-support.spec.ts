import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('escaped formulas', () => {
  it('should serialize properly', async() => {
const engine = await HyperFormula.buildFromArray([['\'=SUM(2,2)']])
    expect(engine.getCellSerialized(adr('A1'))).toEqual('\'=SUM(2,2)')
    expect(engine.getCellValue(adr('A1'))).toEqual('=SUM(2,2)')
  })
})
