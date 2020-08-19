import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

function sleepFor( sleepDuration: number ){
  const now = new Date().getTime()
  while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

describe('Interpreter - function TODAY', () => {
  it('works',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=TODAY()'],
    ])
    expect(engine.getCellValue(adr('A1'))).not.toBeNull()
  })

  it('validates number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TODAY(42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })
})
