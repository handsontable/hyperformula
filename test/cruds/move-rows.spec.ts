import {HyperFormula} from '../../src'
import {CellAddress, Unparser} from '../../src/parser'
import {adr, extractReference} from '../testUtils'

describe("Move rows", () => {
  it('should move one row', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])

    engine.moveRows(0, 1, 1, 3)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should move row when moving upward', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])

    engine.moveRows(0, 2, 1, 1)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should move multiple rows', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])

    engine.moveRows(0, 0, 3, 4)

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('should adjust reference when swapping formula with dependency ', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['=A1'],
    ])

    engine.moveRows(0, 1, 1, 0)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    engine.forceApplyPostponedTransformations()
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 1))

  })
})
