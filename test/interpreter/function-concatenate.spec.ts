import {HandsOnEngine} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('function CONCATENATE', () => {
  it('function CONCATENATE by default returns empty string', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=CONCATENATE()']])

    expect(engine.getCellValue('A1')).toEqual('')
  })

  it('function CONCATENATE works', async () => {
    const engine = await HandsOnEngine.buildFromArray([['John', 'Smith', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue('C1')).toEqual('JohnSmith')
  })

  it('function CONCATENATE returns error if one of the arguments is error', async () => {
    const engine = await HandsOnEngine.buildFromArray([['John', '=1/0', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})
