import {HyperFormula, SimpleCellAddress} from '../src'

const cell = (engine: HyperFormula, address: string, sheet: number = 0): SimpleCellAddress =>
  engine.simpleCellAddressFromString(address, sheet) as SimpleCellAddress

describe('Moving cells to another sheet', () => {
  it('moves the values of a block that holds an empty cell', () => {
    const engine = HyperFormula.buildFromSheets({Sheet1: [[1, null, 3]], Sheet2: []}, {licenseKey: 'gpl-v3'})

    engine.moveCells({start: cell(engine, 'A1'), end: cell(engine, 'C1')}, cell(engine, 'A5', 1))

    expect(engine.getSheetValues(1)).toEqual([[], [], [], [], [1, null, 3]])
  })

  it('moves a block that holds only empty cells', () => {
    const engine = HyperFormula.buildFromSheets({Sheet1: [[1]], Sheet2: [[2]]}, {licenseKey: 'gpl-v3'})

    engine.moveCells({start: cell(engine, 'B2'), end: cell(engine, 'C3')}, cell(engine, 'B2', 1))

    expect(engine.getSheetValues(1)).toEqual([[2]])
  })
})
