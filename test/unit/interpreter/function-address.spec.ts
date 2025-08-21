import {HyperFormula, ErrorType} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('ADDRESS', () => {
  it('with row and col', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1,1)'],
      ['=ADDRESS(77,300)'],
      ['=ADDRESS(ROW(),300)'],
      ['=ADDRESS(45,COLUMN())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('$A$1')
    expect(engine.getCellValue(adr('A2'))).toEqual('$KN$77')
    expect(engine.getCellValue(adr('A3'))).toEqual('$KN$3')
    expect(engine.getCellValue(adr('A4'))).toEqual('$A$45')
  })

  it('with row, col, and abs (A1 Notation)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1,1,1)'],
      ['=ADDRESS(1,1,2)'],
      ['=ADDRESS(1,1,3)'],
      ['=ADDRESS(1,1,4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('$A$1')
    expect(engine.getCellValue(adr('A2'))).toEqual('A$1')
    expect(engine.getCellValue(adr('A3'))).toEqual('$A1')
    expect(engine.getCellValue(adr('A4'))).toEqual('A1')
  })

  it('with row, col, and abs (R1C1 Notation)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1,1,1,FALSE())'],
      ['=ADDRESS(1,1,2,FALSE())'],
      ['=ADDRESS(1,1,3,FALSE())'],
      ['=ADDRESS(1,1,4,FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('R1C1')
    expect(engine.getCellValue(adr('A2'))).toEqual('R1C[1]')
    expect(engine.getCellValue(adr('A3'))).toEqual('R[1]C1')
    expect(engine.getCellValue(adr('A4'))).toEqual('R[1]C[1]')
  })

  it('with row, col, abs, and sheetName (A1 Notation)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1,1,1, TRUE(), "Sheet1")'],
      ['=ADDRESS(1,1,2, TRUE(), "Sheet2")'],
      ['=ADDRESS(1,1,3, TRUE(), "Sheet3")'],
      ['=ADDRESS(1,1,4, TRUE(), "Sheet4")'],
      ['=ADDRESS(1,1,4, TRUE(), "")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('Sheet1!$A$1')
    expect(engine.getCellValue(adr('A2'))).toEqual('Sheet2!A$1')
    expect(engine.getCellValue(adr('A3'))).toEqual('Sheet3!$A1')
    expect(engine.getCellValue(adr('A4'))).toEqual('Sheet4!A1')
    expect(engine.getCellValue(adr('A5'))).toEqual('!A1')
  })

  it('with row, col, abs, and sheetName (R1C1 Notation)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1,1,1, FALSE(), "Sheet1")'],
      ['=ADDRESS(1,1,2, FALSE(), "Sheet2")'],
      ['=ADDRESS(1,1,3, FALSE(), "Sheet3")'],
      ['=ADDRESS(1,1,4, FALSE(), "Sheet4")'],
      ['=ADDRESS(1,1,4, FALSE(), "")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('Sheet1!R1C1')
    expect(engine.getCellValue(adr('A2'))).toEqual('Sheet2!R1C[1]')
    expect(engine.getCellValue(adr('A3'))).toEqual('Sheet3!R[1]C1')
    expect(engine.getCellValue(adr('A4'))).toEqual('Sheet4!R[1]C[1]')
    expect(engine.getCellValue(adr('A5'))).toEqual('!R[1]C[1]')
  })

  it('invalid arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS()'],
      ['=ADDRESS(1)'],
      ['=ADDRESS(0,0)'],
      ['=ADDRESS("row1","row2")'],
      ['=ADDRESS(1,1,0)'],
      ['=ADDRESS(1,1,5)'],
      ['=ADDRESS(1,1,1, true, "")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A7'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('true')))
  })
})

describe('ADDRESS - Compatability Checks', () => {
  it('row negative - col negative', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(-1, -1, 1, FALSE())'],
      ['=ADDRESS(-1, -1, 1, TRUE())'],
      ['=ADDRESS(-1, -1, 2, FALSE())'],
      ['=ADDRESS(-1, -1, 2, TRUE())'],
      ['=ADDRESS(-1, -1, 3, FALSE())'],
      ['=ADDRESS(-1, -1, 3, TRUE())'],
      ['=ADDRESS(-1, -1, 4, FALSE())'],
      ['=ADDRESS(-1, -1, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A7'))).toEqual('R[-1]C[-1]')
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('row negative - col zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(-1, 0, 1, FALSE())'],
      ['=ADDRESS(-1, 0, 1, TRUE())'],
      ['=ADDRESS(-1, 0, 2, FALSE())'],
      ['=ADDRESS(-1, 0, 2, TRUE())'],
      ['=ADDRESS(-1, 0, 3, FALSE())'],
      ['=ADDRESS(-1, 0, 3, TRUE())'],
      ['=ADDRESS(-1, 0, 4, FALSE())'],
      ['=ADDRESS(-1, 0, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A7'))).toEqual('R[-1]C')
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('row negative - col one', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(-1, 1, 1, FALSE())'],
      ['=ADDRESS(-1, 1, 1, TRUE())'],
      ['=ADDRESS(-1, 1, 2, FALSE())'],
      ['=ADDRESS(-1, 1, 2, TRUE())'],
      ['=ADDRESS(-1, 1, 3, FALSE())'],
      ['=ADDRESS(-1, 1, 3, TRUE())'],
      ['=ADDRESS(-1, 1, 4, FALSE())'],
      ['=ADDRESS(-1, 1, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A5'))).toEqual('R[-1]C1')
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A7'))).toEqual('R[-1]C[1]')
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('row zero - col negative', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(0, -1, 1, FALSE())'],
      ['=ADDRESS(0, -1, 1, TRUE())'],
      ['=ADDRESS(0, -1, 2, FALSE())'],
      ['=ADDRESS(0, -1, 2, TRUE())'],
      ['=ADDRESS(0, -1, 3, FALSE())'],
      ['=ADDRESS(0, -1, 3, TRUE())'],
      ['=ADDRESS(0, -1, 4, FALSE())'],
      ['=ADDRESS(0, -1, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A7'))).toEqual('RC[-1]')
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('row zero - col zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(0, 0, 1, FALSE())'],
      ['=ADDRESS(0, 0, 1, TRUE())'],
      ['=ADDRESS(0, 0, 2, FALSE())'],
      ['=ADDRESS(0, 0, 2, TRUE())'],
      ['=ADDRESS(0, 0, 3, FALSE())'],
      ['=ADDRESS(0, 0, 3, TRUE())'],
      ['=ADDRESS(0, 0, 4, FALSE())'],
      ['=ADDRESS(0, 0, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A7'))).toEqual('RC')
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('row zero - col one', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(0, 1, 1, FALSE())'],
      ['=ADDRESS(0, 1, 1, TRUE())'],
      ['=ADDRESS(0, 1, 2, FALSE())'],
      ['=ADDRESS(0, 1, 2, TRUE())'],
      ['=ADDRESS(0, 1, 3, FALSE())'],
      ['=ADDRESS(0, 1, 3, TRUE())'],
      ['=ADDRESS(0, 1, 4, FALSE())'],
      ['=ADDRESS(0, 1, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A5'))).toEqual('RC1')
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A7'))).toEqual('RC[1]')
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('row one - col negative', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1, -1, 1, FALSE())'],
      ['=ADDRESS(1, -1, 1, TRUE())'],
      ['=ADDRESS(1, -1, 2, FALSE())'],
      ['=ADDRESS(1, -1, 2, TRUE())'],
      ['=ADDRESS(1, -1, 3, FALSE())'],
      ['=ADDRESS(1, -1, 3, TRUE())'],
      ['=ADDRESS(1, -1, 4, FALSE())'],
      ['=ADDRESS(1, -1, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A3'))).toEqual('R1C[-1]')
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A7'))).toEqual('R[1]C[-1]')
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('row one - col zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1, 0, 1, FALSE())'],
      ['=ADDRESS(1, 0, 1, TRUE())'],
      ['=ADDRESS(1, 0, 2, FALSE())'],
      ['=ADDRESS(1, 0, 2, TRUE())'],
      ['=ADDRESS(1, 0, 3, FALSE())'],
      ['=ADDRESS(1, 0, 3, TRUE())'],
      ['=ADDRESS(1, 0, 4, FALSE())'],
      ['=ADDRESS(1, 0, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A3'))).toEqual('R1C')
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A7'))).toEqual('R[1]C')
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('row one - col one', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1, 1, 1, FALSE())'],
      ['=ADDRESS(1, 1, 1, TRUE())'],
      ['=ADDRESS(1, 1, 2, FALSE())'],
      ['=ADDRESS(1, 1, 2, TRUE())'],
      ['=ADDRESS(1, 1, 3, FALSE())'],
      ['=ADDRESS(1, 1, 3, TRUE())'],
      ['=ADDRESS(1, 1, 4, FALSE())'],
      ['=ADDRESS(1, 1, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('R1C1')
    expect(engine.getCellValue(adr('A2'))).toEqual('$A$1')
    expect(engine.getCellValue(adr('A3'))).toEqual('R1C[1]')
    expect(engine.getCellValue(adr('A4'))).toEqual('A$1')
    expect(engine.getCellValue(adr('A5'))).toEqual('R[1]C1')
    expect(engine.getCellValue(adr('A6'))).toEqual('$A1')
    expect(engine.getCellValue(adr('A7'))).toEqual('R[1]C[1]')
    expect(engine.getCellValue(adr('A8'))).toEqual('A1')
  })
})
