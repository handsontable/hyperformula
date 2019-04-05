import {HandsOnEngine} from '../src'
import {cellError, ErrorType} from '../src/Cell'
import {Config} from '../src/Config'
import {MatrixPlugin} from '../src/interpreter/plugin/MatrixPlugin'
import './testConfig.ts'

describe('Matrix', () => {
  it('matrix multiplication', () => {
    const config = new Config({ functionPlugins: [MatrixPlugin] })
    const engine = HandsOnEngine.buildFromArray([
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['=mmult(A1:B3,A4:C5)'],
    ], config)

    expect(engine.getCellValue('A6')).toBeCloseTo(9)
    expect(engine.getCellValue('B6')).toBeCloseTo(12)
    expect(engine.getCellValue('C6')).toBeCloseTo(15)
    expect(engine.getCellValue('A7')).toBeCloseTo(19)
    expect(engine.getCellValue('B7')).toBeCloseTo(26)
    expect(engine.getCellValue('C7')).toBeCloseTo(33)
    expect(engine.getCellValue('A8')).toBeCloseTo(29)
    expect(engine.getCellValue('B8')).toBeCloseTo(40)
    expect(engine.getCellValue('C8')).toBeCloseTo(51)
  })

  it('matrix multiplication wrong size', () => {
    const config = new Config({ functionPlugins: [MatrixPlugin] })
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['=mmult(A1:B3,A4:C6)'],
    ], config)

    expect(engine.getCellValue('A7')).toEqual(cellError(ErrorType.VALUE))
    expect(engine.getCellValue('B7')).toEqual(0)
  })

  it ("matrix transpose", () => {
    const config = new Config({ functionPlugins: [MatrixPlugin] })
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=transpose(A1:B3)'],
    ], config)

    expect(engine.getCellValue('A4')).toBeCloseTo(1)
    expect(engine.getCellValue('B4')).toBeCloseTo(3)
    expect(engine.getCellValue('C4')).toBeCloseTo(5)
    expect(engine.getCellValue('A5')).toBeCloseTo(2)
    expect(engine.getCellValue('B5')).toBeCloseTo(4)
    expect(engine.getCellValue('C5')).toBeCloseTo(6)
  })
})
