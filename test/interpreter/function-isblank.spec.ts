import {HandsOnEngine} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Interpreter', () => {
  it('function ISBLANK should return true for references to empty cells', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['', '=ISBLANK(A1)', '=ISBLANK($A1)', '=ISBLANK(OFFSET(C1,0,-2))', '=ISBLANK(A2)'],
      ['=A1']
    ])
    expect(engine.getCellValue('B1')).toEqual(true)
    expect(engine.getCellValue('C1')).toEqual(true)
    expect(engine.getCellValue('D1')).toEqual(true)
    expect(engine.getCellValue('E1')).toEqual(true)
  })

  it('function ISBLANK should return false if it is not reference to empty cell', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['', '=ISBLANK("")', '=ISBLANK(4)', '=ISBLANK(CONCATENATE(A1,A1))'],
    ])
    expect(engine.getCellValue('B1')).toEqual(false)
    expect(engine.getCellValue('C1')).toEqual(false)
    expect(engine.getCellValue('D1')).toEqual(false)
  })

  it('function ISBLANK takes exactly one argument', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=ISBLANK(A3, A2)', '=ISBLANK()'],
    ])
    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.NA))
  })
})
