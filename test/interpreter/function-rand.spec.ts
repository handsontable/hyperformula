import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Interpreter - function RAND', () => {
  it('works',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=RAND()'],
    ])

    expect(engine.getCellValue('A1')).toBeGreaterThanOrEqual(0.0)
    expect(engine.getCellValue('A1')).toBeLessThan(1.0)
  })

  it('validates number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RAND(42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })
})
