import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

function sleepFor( sleepDuration: number ){
  const now = new Date().getTime()
  while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

describe('Interpreter - function NOW', () => {
  it('works',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=NOW()'],
    ])
    const t1 = engine.getCellValue(adr('A1')) as number
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    sleepFor(1000)
    engine.setCellContents(adr('A2'), null)
    const t2 = engine.getCellValue(adr('A1')) as number
    const delta = (t2-t1)*(24*60*60)
    expect(delta).toBeCloseTo(1)
  })

  it('validates number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NOW(42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })
})
