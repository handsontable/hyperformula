import {HandsOnEngine} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Interpreter - function RAND', () => {
  it('works', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=RAND()'],
    ])

    expect(engine.getCellValue('A1')).toBeGreaterThanOrEqual(0.0)
    expect(engine.getCellValue('A1')).toBeLessThan(1.0)
  })

  it('validates number of arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=RAND(42)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })
})
