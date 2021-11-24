import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SUMPRODUCT', () => {
  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUMPRODUCT()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      ['3', '3'],
      ['=SUMPRODUCT(A1:A3,B1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(14)
  })

  it('works for more args',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      ['3', '3'],
      ['=SUMPRODUCT(A1:A3, B1:B3, A1:A3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(36)
  })

  it('works for less args',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      ['3', '3'],
      ['=SUMPRODUCT(A1:A3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(6)
  })

  it('works with wider ranges',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '3', '1', '3'],
      ['2', '4', '2', '4'],
      ['=SUMPRODUCT(A1:B2,C1:D2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(30)
  })

  it('works with cached smaller range',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1', '=SUMPRODUCT(A1:A1, B1:B1)'],
      ['2', '2', '=SUMPRODUCT(A1:A2, B1:B2)'],
      ['3', '3', '=SUMPRODUCT(A1:A3, B1:B3)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('C2'))).toEqual(5)
    expect(engine.getCellValue(adr('C3'))).toEqual(14)
  })

  it('sumproduct from scalars',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUMPRODUCT(42, 78)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3276)
  })

  it('use cached value if the same formula used',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1'],
      ['2', '2'],
      ['=SUMPRODUCT(A1:A2,B1:B2)'],
      ['=SUMPRODUCT(A1:A2,B1:B2)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('it makes a coercion from other values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=TRUE()', '42'],
      ['=SUMPRODUCT(A1,B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(42)
  })

  it('if coercion unsuccessful, it ignores it', async() => {
const engine = await HyperFormula.buildFromArray([
      ['"foobar"', '42'],
      ['=SUMPRODUCT(A1,B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('works even if some string in data',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1'],
      ['asdf', 'fdsafdsa'],
      ['=SUMPRODUCT(A1:A2,B1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('works even if both strings passed',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['asdf', 'fdsafdsa'],
      ['=SUMPRODUCT(A1,B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('works even if both booleans passed',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['=TRUE()', '=FALSE()'],
      ['=SUMPRODUCT(A1,B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('error if error is somewhere in right value',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['42', '78'],
      ['13', '=4/0'],
      ['=SUMPRODUCT(A1:A2,B1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('error if error is somewhere in left value',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['42', '78'],
      ['=3/0', '13'],
      ['=SUMPRODUCT(A1:A2,B1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('error in left has precedence over error in right',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['42', '78'],
      ['=UNKNOWNFUNCTION()', '=3/0'],
      ['=SUMPRODUCT(A1:A2,B1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('UNKNOWNFUNCTION')))
  })

  it('error when different size',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '3', '1', '3'],
      ['2', '4', '2', '4'],
      ['=SUMPRODUCT(A1:B2,C1:C2)'],
      ['=SUMPRODUCT(A1:B2,C1:D1)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
  })

  it('works with matrices',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3'],
      ['=SUMPRODUCT(A1:B1, TRANSPOSE(A1:A2))'],
    ])
    expect(engine.getCellValue(adr('A3'))).toEqual(7)
  })

  it('error if mismatched range shape',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['2'],
      ['3'],
      ['=SUMPRODUCT(A1:C1,A1:A3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EqualLength))
  })

  // Inconsistency with Product 1
  it('order of errors', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '', '=FOOBAR()', '12'],
      ['3', '=4/0', '', '13', '14'],
      ['=SUMPRODUCT(A1:B2, D1:E2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
  })
})
