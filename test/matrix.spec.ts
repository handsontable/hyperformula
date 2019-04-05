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
        ['1', '2'],
        ['3', '4'],
        ['=mmult(A1:B3,A4:B5)'],
    ], config)

    expect(engine.getCellValue('A6')).toBeCloseTo(7)
    expect(engine.getCellValue('B6')).toBeCloseTo(10)
    expect(engine.getCellValue('A7')).toBeCloseTo(15)
    expect(engine.getCellValue('B7')).toBeCloseTo(22)
    expect(engine.getCellValue('A8')).toBeCloseTo(23)
    expect(engine.getCellValue('B8')).toBeCloseTo(34)
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

  it ('matrix transpose', () => {
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

  it ('detects perfect matrix', () => {
    const config = new Config({ functionPlugins: [MatrixPlugin] })
    const engine = HandsOnEngine.buildFromArray([
      ['=D1+1', '=E1+1'],
      ['=D2+1', '=E2+1'],
      ['=D3+1', '=E3+1'],
    ], config)
  })
})
