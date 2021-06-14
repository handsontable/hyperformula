import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

function sleepFor( sleepDuration: number ){
  const now = new Date().getTime()
  while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

describe('Interpreter - function NOW', () => {
  let originalNow: () => number

  beforeEach(() => {
    originalNow = Date.now
    let cnt = 0
    Date.now = () => {
      cnt += 1
      return Date.UTC(1985, 8, 16, 3, 45, 20+cnt, 30)
    }
  })

  it('works',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=NOW()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(31306.2399189815, 6)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
    engine.setCellContents(adr('A2'), null)
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(31306.2399652778, 6)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
  })

  it('validates number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NOW(42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  afterEach(() => {
    Date.now = originalNow
  })
})
