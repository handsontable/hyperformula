import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function AVERAGEIF - argument validations and combinations', () => {
  it('requires 2 or 3 arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGEIF(C1)'],
      ['=AVERAGEIF(C1, ">0", C1, C1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('error when criterion unparsable', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGEIF(B1:B2, "><foo", C1:C2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadCriterion))
  })

  it('error when different width dimension of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGEIF(B1:C1, ">0", B2:D2)'],
      ['=AVERAGEIF(B1, ">0", B2:D2)'],
      ['=AVERAGEIF(B1:D1, ">0", B2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
  })

  it('error when different height dimension of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGEIF(B1:B2, ">0", C1:C3)'],
      ['=AVERAGEIF(B1, ">0", C1:C2)'],
      ['=AVERAGEIF(B1:B2, ">0", C1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
  })

  it('error when number of elements match but dimensions doesnt', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGEIF(B1:B2, ">0", B1:C1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
  })

  it('scalars are treated like singular arrays', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGEIF(10, ">1", 42)'],
      ['=AVERAGEIF(0, ">1", 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(42)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('no coercion', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="1"'],
      ['="foo"'],
      [null],
      ['=AVERAGEIF(A1:A3, "<>42")'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('error propagation', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGEIF(4/0, ">1", 42)'],
      ['=AVERAGEIF(0, 4/0, 42)'],
      ['=AVERAGEIF(0, ">1", 4/0)'],
      ['=AVERAGEIF(0, 4/0, FOOBAR())'],
      ['=AVERAGEIF(4/0, FOOBAR(), 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('works when arguments are just references', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['2', '3'],
      ['=AVERAGEIF(A1, ">1", B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('works with range values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '1', '3', '5'],
      ['1', '1', '7', '9'],
      ['=AVERAGEIF(MMULT(A1:B2, A1:B2), "=2", MMULT(C1:D2, C1:D2))'],
      ['=AVERAGEIF(A1:B2, "=1", MMULT(C1:D2, C1:D2))'],
      ['=AVERAGEIF(MMULT(A1:B2, A1:B2), "=2", C1:D2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(76)
    expect(engine.getCellValue(adr('A4'))).toEqual(76)
    expect(engine.getCellValue(adr('A5'))).toEqual(6)
  })

  it('works for mixed reference/range arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['2', '3'],
      ['=AVERAGEIF(A1:A1, ">1", B1)'],
      ['=AVERAGEIF(A1, ">1", B1:B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })

  it('works for 2 arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['10', '20', '30'],
      ['=AVERAGEIF(A1:C1, ">15")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(25)
  })

  it('works for matrices', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['=TRANSPOSE(A1:B1)'],
      [],
      ['=AVERAGEIF(A2:A3, ">0", A2:A3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(1.5)
  })
})
