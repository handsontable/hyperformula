import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - function TODAY', () => {
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
      ['=TODAY()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(31306)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATE)
  })

  it('validates number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TODAY(42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  afterEach(() => {
    Date.now = originalNow
  })
})
