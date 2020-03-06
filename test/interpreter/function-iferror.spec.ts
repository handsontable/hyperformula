import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function IFERROR', () => {
  it('Should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IFERROR(1)', '=IFERROR(2,3,4)']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })
  it('when no error', () => {
    const engine = HyperFormula.buildFromArray([['=IFERROR("abcd", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('abcd')
  })

  it('when left-error', () => {
    const engine = HyperFormula.buildFromArray([['=IFERROR(1/0, "yes")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('when right-error', () => {
    const engine = HyperFormula.buildFromArray([['=IFERROR("yes", 1/0)']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('when both-error', () => {
    const engine = HyperFormula.buildFromArray([['=IFERROR(#VALUE!, 1/0)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('when range', () => {
    const engine = HyperFormula.buildFromArray([['=IFERROR("yes", A2:A3)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('when cycle', () => {
    const engine = HyperFormula.buildFromArray([['=IFERROR(B1, 1)', '=B1']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('when left-parsing error', () => {
    const engine = HyperFormula.buildFromArray([['=IFERROR(B1, 1/0)', '=SUM(']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
