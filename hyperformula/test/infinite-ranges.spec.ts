import {ErrorType, HyperFormula, SimpleCellAddress} from '../src'

const cell = (engine: HyperFormula, address: string, sheet: number = 0): SimpleCellAddress =>
  engine.simpleCellAddressFromString(address, sheet) as SimpleCellAddress

describe('Whole-column and whole-row ranges', () => {
  describe('moving cells', () => {
    it('a whole-column range includes a cell moved into it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B:B)', null, 5]], {licenseKey: 'gpl-v3'})

      engine.moveCells({start: cell(engine, 'C1'), end: cell(engine, 'C1')}, cell(engine, 'B5'))

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('a whole-row range includes a cell moved into it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(3:3)'], [5]], {licenseKey: 'gpl-v3'})

      engine.moveCells({start: cell(engine, 'A2'), end: cell(engine, 'A2')}, cell(engine, 'D3'))

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('a whole-column range follows a change of a cell moved into it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B:B)', null, 5]], {licenseKey: 'gpl-v3'})
      engine.moveCells({start: cell(engine, 'C1'), end: cell(engine, 'C1')}, cell(engine, 'B5'))

      engine.setCellContents(cell(engine, 'B5'), 8)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(8)
    })

    it('a whole-column range leaves out a cell moved out of it again', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B:B)', null, 5]], {licenseKey: 'gpl-v3'})
      engine.moveCells({start: cell(engine, 'C1'), end: cell(engine, 'C1')}, cell(engine, 'B5'))

      engine.moveCells({start: cell(engine, 'B5'), end: cell(engine, 'B5')}, cell(engine, 'D7'))

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(0)
    })

    it('a whole-column range keeps its value when a cell in it is moved onto itself', () => {
      const engine = HyperFormula.buildFromArray([[1, '=SUM(A:A)'], [2]], {licenseKey: 'gpl-v3'})

      engine.moveCells({start: cell(engine, 'A1'), end: cell(engine, 'A1')}, cell(engine, 'A1'))

      expect(engine.getCellValue(cell(engine, 'B1'))).toBe(3)
    })

    it('a whole-row range keeps its value when a cell in it is moved onto itself', () => {
      const engine = HyperFormula.buildFromArray([[1, 2], ['=SUM(1:1)']], {licenseKey: 'gpl-v3'})

      engine.moveCells({start: cell(engine, 'A1'), end: cell(engine, 'A1')}, cell(engine, 'A1'))

      expect(engine.getCellValue(cell(engine, 'A2'))).toBe(3)
    })

    it('a whole-column range keeps its value when a block under it is moved onto itself', () => {
      const engine = HyperFormula.buildFromArray([[1, '=SUM(A:A)'], [2], [3], [4]], {licenseKey: 'gpl-v3'})

      engine.moveCells({start: cell(engine, 'A2'), end: cell(engine, 'A4')}, cell(engine, 'A2'))

      expect(engine.getCellValue(cell(engine, 'B1'))).toBe(10)
    })

    it('a whole-column range of another sheet includes a cell moved into it together with an empty cell', () => {
      const engine = HyperFormula.buildFromSheets({
        Sheet1: [['=COUNT(Sheet2!B:B)', 5, null, 7]],
        Sheet2: [[1]],
      }, {licenseKey: 'gpl-v3'})

      engine.moveCells({start: cell(engine, 'B1'), end: cell(engine, 'D1')}, cell(engine, 'B2', 1))

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(1)
    })

    it('a whole-column range that moves with its cells keeps their sum', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B:C)', 1, 2]], {licenseKey: 'gpl-v3'})

      engine.moveColumns(0, 1, 2, 5)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(3)
    })
  })

  describe('spilled arrays', () => {
    it('a whole-column range includes an array spilled into it from a cell outside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(C:C)', null, null, 1], [null, null, null, 2]], {licenseKey: 'gpl-v3'})

      engine.setCellContents(cell(engine, 'B5'), '=ARRAYFORMULA(D1:D2*{1,2})')

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(6)
    })

    it('a whole-row range includes an array spilled into it from a cell outside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(5:5)', 1, 2]], {licenseKey: 'gpl-v3'})

      engine.setCellContents(cell(engine, 'D4'), '=ARRAYFORMULA(B1:C1*{1;2})')

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(6)
    })

    it('a whole-column range follows a change of an array spilled into it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(C:C)', null, null, 1], [null, null, null, 2]], {licenseKey: 'gpl-v3'})
      engine.setCellContents(cell(engine, 'B5'), '=ARRAYFORMULA(D1:D2*{1,2})')

      engine.setCellContents(cell(engine, 'D1'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(24)
    })

    it('a whole-column range leaves out an array that was removed', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(C:C)', null, null, 1], [null, null, null, 2]], {licenseKey: 'gpl-v3'})
      engine.setCellContents(cell(engine, 'B5'), '=ARRAYFORMULA(D1:D2*{1,2})')

      engine.setCellContents(cell(engine, 'B5'), null)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(0)
    })
  })

  describe('removing a sheet', () => {
    it('a whole-column range of a sheet that holds no cell returns the #REF! error when the sheet is removed', () => {
      const engine = HyperFormula.buildFromSheets({Sheet1: [], Sheet2: [['=SUM(Sheet1!D:D)']]}, {licenseKey: 'gpl-v3'})

      engine.removeSheet(0)

      expect(engine.getCellValue(cell(engine, 'A1', 1))).toMatchObject({type: ErrorType.REF})
    })

    it('a whole-row range of a sheet that holds no cell returns the #REF! error when the sheet is removed', () => {
      const engine = HyperFormula.buildFromSheets({Sheet1: [], Sheet2: [['=SUM(Sheet1!4:4)']]}, {licenseKey: 'gpl-v3'})

      engine.removeSheet(0)

      expect(engine.getCellValue(cell(engine, 'A1', 1))).toMatchObject({type: ErrorType.REF})
    })

    it('a whole-column range is evaluated again when its removed sheet is added back', () => {
      const engine = HyperFormula.buildFromSheets({Sheet1: [], Sheet2: [['=SUM(Sheet1!D:D)']]}, {licenseKey: 'gpl-v3'})
      engine.removeSheet(0)

      engine.addSheet('Sheet1')

      expect(engine.getCellValue(cell(engine, 'A1', 1))).toBe(0)
    })
  })
})
