import {CellError, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

it('Errors should be parsed and propagated', () => {
  const engine = HyperFormula.buildFromArray([
    ['#DIV/0!', '=A1', '=ISERROR(B1)', '=ISERROR(#DIV/0!)', '=#DIV/0!'],
  ])

  expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  expect(engine.getCellValue(adr('C1'))).toEqual(true)
  expect(engine.getCellValue(adr('D1'))).toEqual(true)
  expect(engine.getCellValue(adr('E1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
})
