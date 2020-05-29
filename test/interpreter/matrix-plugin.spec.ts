import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {MatrixPlugin} from '../../src/interpreter/plugin/MatrixPlugin'
import {adr, detailedError} from '../testUtils'

describe('Matrix plugin', () => {
  beforeAll(() => {
    HyperFormula.registerFunctionPlugin(MatrixPlugin)
  })

  it('matrix multiplication', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['1', '2'],
      ['3', '4'],
      ['{=MMULT(A1:B3,A4:B5)}'],
    ])

    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(7)
    expect(engine.getCellValue(adr('B6'))).toBeCloseTo(10)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(15)
    expect(engine.getCellValue(adr('B7'))).toBeCloseTo(22)
    expect(engine.getCellValue(adr('A8'))).toBeCloseTo(23)
    expect(engine.getCellValue(adr('B8'))).toBeCloseTo(34)
  })

  it('matrix multiplication wrong size', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['{=mmult(A1:B3,A4:C6)}'],
    ])

    expect(engine.getCellValue(adr('A7'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B7'))).toBe(null)
  })

  it('matrix multiplication with string in data', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '{=MMULT(A1:B2,A3:B4)}'],
      ['3', 'foo'],
      ['1', '2', '{=MMULT(A3:B4,A1:B2)}'],
      ['3', '4'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('D2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C3'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('D4'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C3'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('D4'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('nested matrix multiplication', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=MMULT(A1:B2, MMULT(A1:B2,A1:B2))}'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(37)
    expect(engine.getCellValue(adr('B3'))).toEqual(54)
    expect(engine.getCellValue(adr('A4'))).toEqual(81)
    expect(engine.getCellValue(adr('B4'))).toEqual(118)
  })

  it('mmult of other mmult', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '{=MMULT(A1:B2, A1:B2)}', '{=MMULT(A1:B2, A1:B2)}'],
      ['3', '4', '{=MMULT(A1:B2, A1:B2)}', '{=MMULT(A1:B2, A1:B2)}'],
      ['{=MMULT(A1:B2, C1:D2)}'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(37)
    expect(engine.getCellValue(adr('B3'))).toEqual(54)
    expect(engine.getCellValue(adr('A4'))).toEqual(81)
    expect(engine.getCellValue(adr('B4'))).toEqual(118)
  })

  it('mmult of a number', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=MMULT(3, 4)}'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
  })

  it('mmult wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=MMULT(A1:A2)}', '{=MMULT(A1:A2, B1:B2, C1:C2)}'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('matrix multiplication by sumproduct', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['1', '2'],
      ['3', '4'],
      ['=SUMPRODUCT($A1:$B1,transpose(A$4:A$5))', '=SUMPRODUCT($A1:$B1,transpose(B$4:B$5))'],
      ['=SUMPRODUCT($A2:$B2,transpose(A$4:A$5))', '=SUMPRODUCT($A2:$B2,transpose(B$4:B$5))'],
      ['=SUMPRODUCT($A3:$B3,transpose(A$4:A$5))', '=SUMPRODUCT($A3:$B3,transpose(B$4:B$5))'],
    ])

    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(7)
    expect(engine.getCellValue(adr('B6'))).toBeCloseTo(10)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(15)
    expect(engine.getCellValue(adr('B7'))).toBeCloseTo(22)
    expect(engine.getCellValue(adr('A8'))).toBeCloseTo(23)
    expect(engine.getCellValue(adr('B8'))).toBeCloseTo(34)
  })

  it('matrix maxpool', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3', '4', '5', '6'],
      ['11', '12', '13', '14', '15', '16'],
      ['21', '22', '23', '24', '25', '26'],
      ['{=maxpool(A1:F3,3)}'],
    ])

    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(23)
    expect(engine.getCellValue(adr('B4'))).toBeCloseTo(26)
  })

  it('matrix maxpool, custom stride', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3', '4', '5', '6'],
      ['11', '12', '13', '14', '15', '16'],
      ['21', '22', '23', '24', '25', '26'],
      ['28', '29', '30', '31', '32', '33'],
      ['{=maxpool(A1:F4,3,1)}'],
    ])

    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(23)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(30)
    expect(engine.getCellValue(adr('B5'))).toBeCloseTo(24)
    expect(engine.getCellValue(adr('B6'))).toBeCloseTo(31)
    expect(engine.getCellValue(adr('C5'))).toBeCloseTo(25)
    expect(engine.getCellValue(adr('C6'))).toBeCloseTo(32)
    expect(engine.getCellValue(adr('D5'))).toBeCloseTo(26)
    expect(engine.getCellValue(adr('D6'))).toBeCloseTo(33)
  })

  it('maxpool wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=MAXPOOL(A1:A2)}', '{=MAXPOOL(A1:A2, 0,0,0)}'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('matrix medianpool on even square', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '1', '2', '1', '5'],
      ['3', '4', '3', '7', '6', '7'],
      ['{=medianpool(A1:F2,2)}'],
    ])

    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(2.5)
    expect(engine.getCellValue(adr('B3'))).toBeCloseTo(2.5)
    expect(engine.getCellValue(adr('C3'))).toBeCloseTo(5.5)
  })

  it('medianpool wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=MEDIANPOOL(A1:A2)}', '{=MEDIANPOOL(A1:A2, 0,0,0)}'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('matrix medianpool on odd square', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '1', '1'], // right shot from the beginning
      ['1', '2', '3'],
      ['3', '3', '3'],

      ['2', '2', '2'], // need one step to the left
      ['3', '4', '6'],
      ['10', '10', '10'],

      ['0', '0', '0'], // need one step to the right
      ['4', '6', '7'],
      ['8', '8', '8'],

      ['{=medianpool(A1:C9,3)}'],
    ])

    expect(engine.getCellValue(adr('A10'))).toBeCloseTo(2)
    expect(engine.getCellValue(adr('A11'))).toBeCloseTo(4)
    expect(engine.getCellValue(adr('A12'))).toBeCloseTo(6)
  })
})

describe('Function TRANSPOSE', () => {
  it('transpose works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['{=TRANSPOSE(A1:B3)}'],
    ])

    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(1)
    expect(engine.getCellValue(adr('B4'))).toBeCloseTo(3)
    expect(engine.getCellValue(adr('C4'))).toBeCloseTo(5)
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(2)
    expect(engine.getCellValue(adr('B5'))).toBeCloseTo(4)
    expect(engine.getCellValue(adr('C5'))).toBeCloseTo(6)
  })

  it('transpose works for scalar', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=TRANSPOSE(1)}'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1)
  })

  it('transpose returns error if argument evaluates to error', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=TRANSPOSE(4/0)}'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('transpose wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=TRANSPOSE()}', '{=TRANSPOSE(A1:A2, B1:B2)}'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })
  it('transpose returns VALUE when wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=TRANSPOSE("fdsa")}'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('transpose without braces', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=TRANSPOSE(A1:B3)'],
    ])

    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A5'))).toBe(null)
    expect(engine.getCellValue(adr('B4'))).toBe(null)
  })
})
