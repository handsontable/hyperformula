import {HandsOnEngine} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Interpreter', () => {
  it('function EXP happy path', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=EXP(0)', '=EXP(2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(1)
    expect(engine.getCellValue('B1')).toBeCloseTo(7.38905609893065)
  })

  it('function EXP given wrong argument type', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=EXP("foo")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('function EXP given wrong number of arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=EXP()'],
      ['=EXP(1, 2)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.NA))
  })
})
