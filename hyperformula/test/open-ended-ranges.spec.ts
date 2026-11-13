import {ConfigParams, ConfigValueTooSmallError, ErrorType, ExpectedValueOfTypeError, HyperFormula, SimpleCellAddress} from '../src'

const openEnded = {licenseKey: 'gpl-v3', openEndedRangeMinRows: 10, openEndedRangeMinColumns: 10}

const cell = (engine: HyperFormula, address: string, sheet: number = 0): SimpleCellAddress =>
  engine.simpleCellAddressFromString(address, sheet) as SimpleCellAddress

describe('Config - openEndedRangeMinRows and openEndedRangeMinColumns', () => {
  it('openEndedRangeMinRows is Number.MAX_SAFE_INTEGER by default', () => {
    const engine = HyperFormula.buildEmpty({licenseKey: 'gpl-v3'})

    expect(engine.getConfig().openEndedRangeMinRows).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('openEndedRangeMinColumns is Number.MAX_SAFE_INTEGER by default', () => {
    const engine = HyperFormula.buildEmpty({licenseKey: 'gpl-v3'})

    expect(engine.getConfig().openEndedRangeMinColumns).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('the default configuration builds an engine after a round trip through JSON', () => {
    const engine = HyperFormula.buildEmpty({licenseKey: 'gpl-v3'})
    const config = JSON.parse(JSON.stringify(engine.getConfig())) as Partial<ConfigParams>

    expect(HyperFormula.buildEmpty(config).getConfig().openEndedRangeMinRows).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('a configuration with the options set keeps them after a round trip through JSON', () => {
    const engine = HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinRows: 32768, openEndedRangeMinColumns: 4096})
    const config = JSON.parse(JSON.stringify(engine.getConfig())) as Partial<ConfigParams>

    expect(HyperFormula.buildEmpty(config).getConfig()).toMatchObject({openEndedRangeMinRows: 32768, openEndedRangeMinColumns: 4096})
  })

  it('openEndedRangeMinRows accepts a positive integer', () => {
    const engine = HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinRows: 32768})

    expect(engine.getConfig().openEndedRangeMinRows).toBe(32768)
  })

  it('openEndedRangeMinColumns accepts a positive integer', () => {
    const engine = HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinColumns: 4096})

    expect(engine.getConfig().openEndedRangeMinColumns).toBe(4096)
  })

  it('openEndedRangeMinRows accepts 1', () => {
    const engine = HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinRows: 1})

    expect(engine.getConfig().openEndedRangeMinRows).toBe(1)
  })

  it('openEndedRangeMinRows rejects Infinity', () => {
    expect(() => HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinRows: Infinity}))
      .toThrow(new ExpectedValueOfTypeError('integer', 'openEndedRangeMinRows'))
  })

  it('openEndedRangeMinRows rejects 0', () => {
    expect(() => HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinRows: 0}))
      .toThrow(new ConfigValueTooSmallError('openEndedRangeMinRows', 1))
  })

  it('openEndedRangeMinColumns rejects 0', () => {
    expect(() => HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinColumns: 0}))
      .toThrow(new ConfigValueTooSmallError('openEndedRangeMinColumns', 1))
  })

  it('openEndedRangeMinRows rejects a negative integer', () => {
    expect(() => HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinRows: -5}))
      .toThrow(new ConfigValueTooSmallError('openEndedRangeMinRows', 1))
  })

  it('openEndedRangeMinRows rejects a fraction', () => {
    expect(() => HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinRows: 10.5}))
      .toThrow(new ExpectedValueOfTypeError('integer', 'openEndedRangeMinRows'))
  })

  it('openEndedRangeMinColumns rejects a fraction', () => {
    expect(() => HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinColumns: 10.5}))
      .toThrow(new ExpectedValueOfTypeError('integer', 'openEndedRangeMinColumns'))
  })

  it('openEndedRangeMinRows rejects NaN', () => {
    expect(() => HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinRows: NaN}))
      .toThrow(new ExpectedValueOfTypeError('integer', 'openEndedRangeMinRows'))
  })

  it('openEndedRangeMinRows rejects negative Infinity', () => {
    expect(() => HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinRows: -Infinity}))
      .toThrow(new ExpectedValueOfTypeError('integer', 'openEndedRangeMinRows'))
  })

  it('openEndedRangeMinColumns rejects a string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    expect(() => HyperFormula.buildEmpty({licenseKey: 'gpl-v3', openEndedRangeMinColumns: '10' as any}))
      .toThrow(new ExpectedValueOfTypeError('integer', 'openEndedRangeMinColumns'))
  })
})

describe('Ranges with the default configuration', () => {
  it('a tall range holds a cell for every row', () => {
    const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], {licenseKey: 'gpl-v3'})

    expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 30})
  })

  it('a wide range holds a cell for every column', () => {
    const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [null, 2, 3]], {licenseKey: 'gpl-v3'})

    expect(engine.getSheetDimensions(0)).toEqual({width: 26, height: 2})
  })
})

describe('Open-ended ranges - tall ranges', () => {
  describe('cells held by the sheet', () => {
    it('holds no cell below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 3})
    })

    it('a range one row shorter than openEndedRangeMinRows holds a cell for every row', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B10)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 10})
    })

    it('a range exactly openEndedRangeMinRows tall is open-ended', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B11)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 3})
    })

    it('a narrow range is open-ended when only openEndedRangeMinRows is set', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], {licenseKey: 'gpl-v3', openEndedRangeMinRows: 10})

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 3})
    })

    it('a tall range is not open-ended when only openEndedRangeMinColumns is set', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], {licenseKey: 'gpl-v3', openEndedRangeMinColumns: 10})

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 30})
    })

    it('a range one row longer than another open-ended range holds no cell in its last row', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B29)', 1], ['=SUM(B2:B30)', 2]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 2})
    })

    it('a range starting below the cells of the sheet holds no cell', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B20:B40)', 1]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 1})
    })

    it('holds no cell in a range of a sheet with millions of rows', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(J42:J1048576)']], {licenseKey: 'gpl-v3', maxRows: 1048576, openEndedRangeMinRows: 32768})

      expect(engine.getSheetDimensions(0)).toEqual({width: 1, height: 1})
    })
  })

  describe('values', () => {
    it('sums the cells of the range and leaves out the rows above it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('evaluates a range starting below the cells of the sheet to nothing', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B20:B40)', 1]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(0)
    })

    it('does not read the formula cell when the range starts just below it', () => {
      const engine = HyperFormula.buildFromArray([[null, '=SUM(B2:B30)'], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'B1'))).toBe(5)
    })

    it('reports a cycle when a cell of the range refers to the formula', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2]], openEnded)

      engine.setCellContents(cell(engine, 'B20'), '=A1')

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.CYCLE})
    })

    it('evaluates a range of a sheet with millions of rows', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(J42:J1048576)']], {licenseKey: 'gpl-v3', maxRows: 1048576, openEndedRangeMinRows: 32768})

      engine.setCellContents(cell(engine, 'J50000'), 5)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('evaluates a range in calculateFormula', () => {
      const engine = HyperFormula.buildFromArray([[null, 1], [null, 2], [null, 3]], openEnded)

      expect(engine.calculateFormula('=SUM(B2:B30)', 0)).toBe(5)
    })

    it('evaluates a range used through a named expression', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(Data)', 1], [null, 2], [null, 3]], openEnded)
      engine.addNamedExpression('Data', '=Sheet1!$B$2:$B$30')

      engine.setCellContents(cell(engine, 'B20'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })
  })

  describe('cells set later', () => {
    it('includes a value set below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.setCellContents(cell(engine, 'B20'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('includes a value set in the last row of the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.setCellContents(cell(engine, 'B30'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('leaves out a value set just below the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.setCellContents(cell(engine, 'B31'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('follows a change of a value set below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.setCellContents(cell(engine, 'B20'), 10)

      engine.setCellContents(cell(engine, 'B20'), 20)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(25)
    })

    it('follows the removal of a value set below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.setCellContents(cell(engine, 'B20'), 10)

      engine.setCellContents(cell(engine, 'B20'), null)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('includes a formula set below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.setCellContents(cell(engine, 'B20'), '=B1*10')

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('follows a change of the precedent of a formula set below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.setCellContents(cell(engine, 'B20'), '=B1*10')

      engine.setCellContents(cell(engine, 'B1'), 4)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(45)
    })

    it('includes a value set in a range that started below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B20:B40)', 1]], openEnded)

      engine.setCellContents(cell(engine, 'B25'), 4)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(4)
    })

    it('includes a value set in the last row of a range one row longer than another', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B29)', 1], ['=SUM(B2:B30)', 2]], openEnded)

      engine.setCellContents(cell(engine, 'B30'), 10)

      expect(engine.getCellValue(cell(engine, 'A2'))).toBe(12)
    })

    it('leaves a value set below a range out of it when a range one row longer exists', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B29)', 1], ['=SUM(B2:B30)', 2]], openEnded)

      engine.setCellContents(cell(engine, 'B30'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('includes an array spilled into the range from a cell outside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(C10:C40)', null, null, 1], [null, null, null, 2]], openEnded)

      engine.setCellContents(cell(engine, 'B20'), '=ARRAYFORMULA(D1:D2*{1,2})')

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(6)
    })

    it('returns the #REF! error when the sheet of a range that holds no cell is removed', () => {
      const engine = HyperFormula.buildFromSheets({Sheet1: [[1]], Sheet2: [['=SUM(Sheet1!D20:D40)']]}, openEnded)

      engine.removeSheet(0)

      expect(engine.getCellValue(cell(engine, 'A1', 1))).toMatchObject({type: ErrorType.REF})
    })

    it('includes a value set in a range of another sheet', () => {
      const engine = HyperFormula.buildFromSheets({Sheet1: [['=SUM(Sheet2!B2:B30)']], Sheet2: [[null, 1], [null, 2]]}, openEnded)

      engine.setCellContents(cell(engine, 'B20', 1), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(12)
    })
  })

  describe('functions that use the full size of the range', () => {
    it('ROWS returns the number of rows of the range', () => {
      const engine = HyperFormula.buildFromArray([['=ROWS(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(29)
    })

    it('COLUMNS returns the number of columns of the range', () => {
      const engine = HyperFormula.buildFromArray([['=COLUMNS(B2:C30)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('COUNTBLANK counts the rows below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(27)
    })

    it('COUNTBLANK counts every cell of a range starting below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B20:B40)', 1]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(21)
    })

    it('COUNTBLANK counts the cells of a range clamped to a single cell', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B1:B30)', 7]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(29)
    })

    it('COUNTBLANK counts the rows of a range when no sheet holds a cell', () => {
      const engine = HyperFormula.buildFromSheets({Sheet1: []}, openEnded)

      expect(engine.calculateFormula('=COUNTBLANK(B1:B40)', 0)).toBe(40)
    })

    it('COUNTBLANK counts the cells of two ranges', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:B30, C2:C30)', 1, 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(56)
    })

    it('ROWS returns the number of rows of a range used through a named expression', () => {
      const engine = HyperFormula.buildFromArray([[null, 1], [null, 2], [null, 3]], openEnded)
      engine.addNamedExpression('Data', '=Sheet1!$B$2:$B$30')

      engine.setCellContents(cell(engine, 'A1'), '=ROWS(Data)')

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(29)
    })

    it('COLUMNS returns the number of columns of a range used through a named expression', () => {
      const engine = HyperFormula.buildFromArray([[null], [1, 2, 3]], openEnded)
      engine.addNamedExpression('Data', '=Sheet1!$B$2:$Z$2')

      engine.setCellContents(cell(engine, 'A1'), '=COLUMNS(Data)')

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(25)
    })

    it('COUNTBLANK counts the rows below the cells of the sheet in a range used through a named expression', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(Data)', 1], [null, 2], [null, 3]], openEnded)
      engine.addNamedExpression('Data', '=Sheet1!$B$2:$B$30')

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(27)
    })

    it('COUNTBLANK counts the rows below the cells of the sheet in a range in parentheses', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK((B2:B30))', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(27)
    })

    it('COUNTBLANK counts the rows of a sheet with millions of rows', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(J42:J1048576)']], {licenseKey: 'gpl-v3', maxRows: 1048576, openEndedRangeMinRows: 32768})

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(1048535)
    })

    it('COUNTIF counts the rows below the cells of the sheet for a criterion that empty cells meet', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIF(B2:B30, "<>2")', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(28)
    })

    it('COUNTIF leaves out the rows below the cells of the sheet for a criterion that empty cells do not meet', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIF(B2:B30, ">2")', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(1)
    })

    it('COUNTIFS counts the rows below the cells of the sheet when empty cells meet every criterion', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIFS(B2:B30, "<>2", C2:C30, "<>y")', 1, 'x'], [null, 2, 'x'], [null, 3, 'y']], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(27)
    })

    it('COUNTIFS leaves out the rows below the cells of the sheet when empty cells do not meet one criterion', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIFS(B2:B30, "<>2", C2:C30, "y")', 1, 'x'], [null, 2, 'x'], [null, 3, 'y']], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(1)
    })

    it('COUNTIFS returns the #VALUE! error for ranges of different heights', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIFS(B2:B30, "<>2", C2:C29, "<>y")', 1, 'x'], [null, 2, 'x'], [null, 3, 'y']], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.VALUE})
    })

    it('COUNTIFS pairs the cells of ranges that start in different rows', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIFS(B2:B30, ">0", C3:C31, "y")', 1, 'x'], [null, 2, 'x'], [null, 3, 'y']], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(1)
    })

    it('COUNTIFS returns the #VALUE! error for a shorter range that is as tall as the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIFS(B1:B30, ">0", C1:C2, "x")', 1, 'x'], [null, 2, 'x']], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.VALUE})
    })

    it('COUNTIFS pairs the cells of a range with an array computed from a range of the same size', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIFS(B2:B30, ">2", C2:C30*2, 20)', 1, 10], [null, 2, 10], [null, 3, 10], [null, 4, 30]], {...openEnded, useArrayArithmetic: true})

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(1)
    })

    it('SUMIFS sums the cells of rows that meet a criterion', () => {
      const engine = HyperFormula.buildFromArray([['=SUMIFS(B2:B30, C2:C30, "x")', 1, 'x'], [null, 2, 'x'], [null, 3, 'y']], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('SUMIFS includes a row set below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUMIFS(B2:B30, C2:C30, "x")', 1, 'x'], [null, 2, 'x'], [null, 3, 'y']], openEnded)

      engine.setCellContents(cell(engine, 'B20'), [[10, 'x']])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(12)
    })

    it('SUMIFS pairs the cells of ranges on sheets of different heights', () => {
      const engine = HyperFormula.buildFromSheets({
        Sheet1: [['=SUMIFS(Sheet2!C2:C30, B2:B30, "")', 1], [null, 2]],
        Sheet2: [[null, null, 1], [null, null, 2], [null, null, 4], [null, null, 8]],
      }, openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(12)
    })

    it('AVERAGEIF averages the cells that meet a criterion', () => {
      const engine = HyperFormula.buildFromArray([['=AVERAGEIF(B2:B30, ">0")', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2.5)
    })

    it('INDEX returns a cell of the range', () => {
      const engine = HyperFormula.buildFromArray([['=INDEX(B2:B30, 2)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(3)
    })

    it('INDEX returns an empty value for a row below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=INDEX(B2:B30, 20)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBeNull()
    })

    it('INDEX returns an empty value for a row of a range clamped to a single cell', () => {
      const engine = HyperFormula.buildFromArray([['=INDEX(B1:B30, 5)', 7]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBeNull()
    })

    it('INDEX returns the #NUM! error for a row past the range', () => {
      const engine = HyperFormula.buildFromArray([['=INDEX(B2:B30, 30)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.NUM})
    })
  })

  describe('lookups', () => {
    it('MATCH finds a value in the range', () => {
      const engine = HyperFormula.buildFromArray([['=MATCH(3, B2:B30, 0)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('VLOOKUP finds a value in the range', () => {
      const engine = HyperFormula.buildFromArray([['=VLOOKUP(3, B2:C30, 2, FALSE())', 1, 'x'], [null, 2, 'y'], [null, 3, 'z']], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe('z')
    })

    it('VLOOKUP finds a value set below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=VLOOKUP(9, B2:C30, 2, FALSE())', 1, 'x'], [null, 2, 'y'], [null, 3, 'z']], openEnded)

      engine.setCellContents(cell(engine, 'B20'), [[9, 'far']])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe('far')
    })

    it('VLOOKUP finds a value set below the cells of the sheet when useColumnIndex is on', () => {
      const engine = HyperFormula.buildFromArray([['=VLOOKUP(9, B2:C30, 2, FALSE())', 1, 'x'], [null, 2, 'y'], [null, 3, 'z']], {...openEnded, useColumnIndex: true})

      engine.setCellContents(cell(engine, 'B20'), [[9, 'far']])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe('far')
    })

    it('VLOOKUP returns the #N/A error for a value that is not in the range', () => {
      const engine = HyperFormula.buildFromArray([['=VLOOKUP(9, B2:C30, 2, FALSE())', 1, 'x'], [null, 2, 'y'], [null, 3, 'z']], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.NA})
    })

    it('XLOOKUP finds a value set below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=XLOOKUP("k", B2:B30, C2:C30, "none")', 1, 'x'], [null, 2, 'y']], openEnded)

      engine.setCellContents(cell(engine, 'B20'), [['k', 'far']])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe('far')
    })
  })

  describe('array arithmetic', () => {
    it('evaluates array arithmetic over the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30*2)', 1], [null, 2], [null, 3]], {...openEnded, useArrayArithmetic: true})

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(10)
    })

    it('criterion functions count as empty only the rows that the sheets hold when a condition is an array computed from a range', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIFS(B2:B30, "", C2:C30*2, 0)', 1], [null, 2], [null, null], [null, 3]], {...openEnded, useArrayArithmetic: true})

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('counts as empty only the rows that the sheets hold', () => {
      const engine = HyperFormula.buildFromArray([['=SUMPRODUCT((B2:B30="")*1)', 1], [null, 2], [null, null], [null, 3]], {...openEnded, useArrayArithmetic: true})

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('gives ranges that start in different rows the same height', () => {
      const engine = HyperFormula.buildFromArray([['=SUMPRODUCT(B2:B30, C3:C31)', 1, 1], [null, 2, 10], [null, 3, 100], [null, 4, 1000]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(3200)
    })

    it('gives ranges on sheets of different heights the same height', () => {
      const engine = HyperFormula.buildFromSheets({
        Sheet1: [['=SUMPRODUCT(B2:B30, Sheet2!B2:B30)', 1], [null, 2], [null, 3]],
        Sheet2: [[null, 1], [null, 10], [null, 100], [null, 1000], [null, 10000]],
      }, openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(320)
    })

    it('spills every row of the range', () => {
      const engine = HyperFormula.buildFromArray([['=ARRAYFORMULA(B2:B30*2)', 1], [null, 2], [null, 3]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 29})
    })
  })

  describe('adding and removing rows and columns', () => {
    it('moves the range down when rows are added above it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.addRows(0, [1, 2])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B4:B32)')
    })

    it('keeps the value when rows are added above the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.addRows(0, [1, 2])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('includes a value set below the cells of the sheet after rows were added above the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.addRows(0, [1, 2])

      engine.setCellContents(cell(engine, 'B32'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('extends the range when rows are added inside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.addRows(0, [2, 2])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:B32)')
    })

    it('includes a value set in a row added inside the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.addRows(0, [2, 2])

      engine.setCellContents(cell(engine, 'B3'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('holds no cell below the cells of the sheet after rows were added inside the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.addRows(0, [2, 2])

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 5})
    })

    it('shrinks the range when rows are removed inside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.removeRows(0, [2, 1])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:B29)')
    })

    it('leaves out the cells of rows removed inside the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.removeRows(0, [2, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('extends the range when rows are added inside it below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.addRows(0, [10, 2])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:B32)')
    })

    it('holds no cell below the cells of the sheet after rows were added there', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.addRows(0, [10, 2])

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 3})
    })

    it('includes a value set in the last row of a range extended below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.addRows(0, [10, 2])

      engine.setCellContents(cell(engine, 'B32'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('moves the range down when rows are added between the cells of the sheet and the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(A5:A30)'], [1]], openEnded)

      engine.addRows(0, [3, 1])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(A6:A31)')
    })

    it('leaves out a value set just above a range that was moved down below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(A5:A30)'], [1]], openEnded)
      engine.addRows(0, [3, 1])

      engine.setCellContents(cell(engine, 'A5'), 100)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(0)
    })

    it('keeps the range when rows are added below it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.addRows(0, [40, 2])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:B30)')
    })

    it('shrinks the range when rows are removed inside it below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.removeRows(0, [10, 2])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:B28)')
    })

    it('leaves out a value set just below a range that was shrunk below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.removeRows(0, [10, 2])

      engine.setCellContents(cell(engine, 'B29'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('returns the #REF! error when all rows of a range below the cells of the sheet are removed', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(A5:A30)'], [1]], openEnded)

      engine.removeRows(0, [4, 26])

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.REF})
    })

    it('restores the range when adding rows below the cells of the sheet is undone', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.addRows(0, [10, 2])

      engine.undo()

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:B30)')
    })

    it('restores the range when removing rows below the cells of the sheet is undone', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.removeRows(0, [10, 2])

      engine.undo()

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:B30)')
    })

    it('keeps the range when a row is moved to a row between the cells of the sheet and the range', () => {
      const engine = HyperFormula.buildFromArray([[1], [null, '=SUM(A5:A30)']], openEnded)

      engine.moveRows(0, 1, 1, 4)

      expect(engine.getCellFormula(cell(engine, 'B4'))).toBe('=SUM(A5:A30)')
    })

    it('keeps the range when a column is moved to a column between the cells of the sheet and the range', () => {
      const engine = HyperFormula.buildFromArray([[1], [null, '=COUNTA(D6:D30)']], openEnded)

      engine.moveColumns(0, 1, 1, 3)

      expect(engine.getCellFormula(cell(engine, 'C2'))).toBe('=COUNTA(D6:D30)')
    })

    it('COUNTBLANK leaves out an empty row removed inside a range that was created before the sheet grew', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:B30)', 1], [null, 2]], openEnded)
      engine.setCellContents(cell(engine, 'D20'), 7)

      engine.removeRows(0, [9, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(27)
    })

    it('COUNTIF leaves out an empty row removed inside a range that was created before the sheet grew', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIF(B2:B30, "")', 1], [null, 2]], openEnded)
      engine.setCellContents(cell(engine, 'D20'), 7)

      engine.removeRows(0, [9, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(27)
    })

    it('INDEX returns the #NUM! error for a row that removing empty rows put past the range', () => {
      const engine = HyperFormula.buildFromArray([['=INDEX(B2:B30, 29)', 1], [null, 2]], openEnded)
      engine.setCellContents(cell(engine, 'D20'), 7)

      engine.removeRows(0, [9, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.NUM})
    })

    it('COUNTBLANK counts an empty row added inside a range that was created before the sheet grew', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:B30)', 1], [null, 2]], openEnded)
      engine.setCellContents(cell(engine, 'D20'), 7)

      engine.addRows(0, [9, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(29)
    })

    it('COUNTIF counts an empty row added inside a range that was created before the sheet grew', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIF(B2:B30, "")', 1], [null, 2]], openEnded)
      engine.setCellContents(cell(engine, 'D20'), 7)

      engine.addRows(0, [9, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(29)
    })

    it('COUNTBLANK leaves out an empty row removed below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:B30)', 1], [null, 2]], openEnded)

      engine.removeRows(0, [9, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(27)
    })

    it('COUNTBLANK counts the rows of a range that removing rows made equal to another range', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:B30)', 1], ['=COUNTBLANK(B2:B32)', 2]], openEnded)

      engine.removeRows(0, [29, 2])

      expect(engine.getCellValue(cell(engine, 'A2'))).toBe(28)
    })

    it('keeps including the cells set later when removing rows makes the range shorter than openEndedRangeMinRows', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B12)', 1], [null, 2], [null, 3], [null, 4]], openEnded)
      engine.removeRows(0, [2, 2])

      engine.setCellContents(cell(engine, 'B9'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(12)
    })

    it('counts the empty cells of a range that removing rows made shorter than openEndedRangeMinRows', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:B12)', 1], [null, 2], [null, 3], [null, 4]], openEnded)

      engine.removeRows(0, [2, 2])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(8)
    })

    it('reuses a range that removing rows made shorter than openEndedRangeMinRows in a new formula', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B12)', 1], ['=SUM(B2:B11)', 2], [null, 3], [null, 4]], openEnded)
      engine.removeRows(0, [2, 2])

      engine.setCellContents(cell(engine, 'C1'), '=SUM(B2:B10)')

      expect(engine.getCellValue(cell(engine, 'C1'))).toBe(2)
    })

    it('keeps including the cells set later when adding rows makes a range as tall as openEndedRangeMinRows', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B10)', 1], [null, 2], [null, 3]], openEnded)
      engine.addRows(0, [2, 1])

      engine.setCellContents(cell(engine, 'B11'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('moves the range right when columns are added before it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.addColumns(0, [1, 1])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(C2:C30)')
    })

    it('includes a value set below the cells of the sheet after columns were added before the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.addColumns(0, [1, 1])

      engine.setCellContents(cell(engine, 'C20'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('extends the range when columns are added inside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:C30)', 1, 1], [null, 2, 2]], openEnded)

      engine.addColumns(0, [2, 1])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:D30)')
    })

    it('holds no cell below the cells of the sheet after columns were added inside the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:C30)', 1, 1], [null, 2, 2]], openEnded)

      engine.addColumns(0, [2, 1])

      expect(engine.getSheetDimensions(0)).toEqual({width: 4, height: 2})
    })

    it('includes a value set in a column added inside the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:C30)', 1, 1], [null, 2, 2]], openEnded)
      engine.addColumns(0, [2, 1])

      engine.setCellContents(cell(engine, 'C20'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(14)
    })

    it('returns the #REF! error when the columns of a range right of the cells of the sheet are removed', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(C6:C30)'], [1]], openEnded)

      engine.removeColumns(0, [2, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.REF})
    })

    it('returns the #REF! error when the columns of the range are removed', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.removeColumns(0, [1, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.REF})
    })
  })

  describe('moving cells', () => {
    it('includes a cell moved into the range below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1, 7], [null, 2], [null, 3]], openEnded)

      engine.moveCells({start: cell(engine, 'C1'), end: cell(engine, 'C1')}, cell(engine, 'B20'))

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(12)
    })

    it('leaves out a cell moved out of the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.setCellContents(cell(engine, 'B20'), 10)

      engine.moveCells({start: cell(engine, 'B20'), end: cell(engine, 'B20')}, cell(engine, 'D5'))

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('keeps the range when the formula is moved', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.moveCells({start: cell(engine, 'A1'), end: cell(engine, 'A1')}, cell(engine, 'D4'))

      expect(engine.getCellFormula(cell(engine, 'D4'))).toBe('=SUM(B2:B30)')
    })

    it('includes a value set below the cells of the sheet after the formula was moved', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.moveCells({start: cell(engine, 'A1'), end: cell(engine, 'A1')}, cell(engine, 'D4'))

      engine.setCellContents(cell(engine, 'B20'), 10)

      expect(engine.getCellValue(cell(engine, 'D4'))).toBe(15)
    })

    it('moves the range when all its cells are moved', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.moveCells({start: cell(engine, 'B2'), end: cell(engine, 'B30')}, cell(engine, 'D2'))

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(D2:D30)')
    })

    it('includes a value set below the cells of the sheet after the range was moved', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.moveCells({start: cell(engine, 'B2'), end: cell(engine, 'B30')}, cell(engine, 'D2'))

      engine.setCellContents(cell(engine, 'D20'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('keeps the value when a cell of the range is moved onto itself', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.moveCells({start: cell(engine, 'B2'), end: cell(engine, 'B2')}, cell(engine, 'B2'))

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('includes a cell moved into a range of another sheet together with an empty cell', () => {
      const engine = HyperFormula.buildFromSheets({
        Sheet1: [['=COUNT(Sheet2!B1:B30)', 5, null, 7]],
        Sheet2: [[1]],
      }, openEnded)

      engine.moveCells({start: cell(engine, 'B1'), end: cell(engine, 'D1')}, cell(engine, 'B2', 1))

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(1)
    })

    it('keeps the value when a row of the range is moved inside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3], [null, 4]], openEnded)

      engine.moveRows(0, 1, 1, 4)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(9)
    })
  })

  describe('undo and redo', () => {
    it('undoes setting a value below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.setCellContents(cell(engine, 'B20'), 10)

      engine.undo()

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('redoes setting a value below the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.setCellContents(cell(engine, 'B20'), 10)
      engine.undo()

      engine.redo()

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('restores the range when removing rows inside it is undone', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.removeRows(0, [2, 1])

      engine.undo()

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:B30)')
    })

    it('restores the value when removing rows inside the range is undone', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.removeRows(0, [2, 1])

      engine.undo()

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('restores the value when removing the formula is undone', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)
      engine.setCellContents(cell(engine, 'A1'), null)
      engine.undo()

      engine.setCellContents(cell(engine, 'B20'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('leaves out a cell again when moving it into the range is undone', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1, 7], [null, 2], [null, 3]], openEnded)
      engine.moveCells({start: cell(engine, 'C1'), end: cell(engine, 'C1')}, cell(engine, 'B20'))

      engine.undo()

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })
  })

  describe('updateConfig', () => {
    it('releases the cells below the cells of the sheet when the option is turned on', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], {licenseKey: 'gpl-v3'})

      engine.updateConfig({openEndedRangeMinRows: 10})

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 3})
    })

    it('holds a cell for every row when the option is turned off', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], openEnded)

      engine.updateConfig({openEndedRangeMinRows: Number.MAX_SAFE_INTEGER})

      expect(engine.getSheetDimensions(0)).toEqual({width: 2, height: 30})
    })

    it('keeps the value when the option is turned on', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], {licenseKey: 'gpl-v3'})

      engine.updateConfig({openEndedRangeMinRows: 10})

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('includes a value set below the cells of the sheet after the option was turned on', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:B30)', 1], [null, 2], [null, 3]], {licenseKey: 'gpl-v3'})
      engine.updateConfig({openEndedRangeMinRows: 10})

      engine.setCellContents(cell(engine, 'B20'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })
  })
})

describe('Open-ended ranges - wide ranges', () => {
  describe('columns held by the sheet', () => {
    it('holds no cell right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [null, 2, 3]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 3, height: 2})
    })

    it('a range one column narrower than openEndedRangeMinColumns holds a cell for every column', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:J2)'], [null, 2, 3]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 10, height: 2})
    })

    it('a range exactly openEndedRangeMinColumns wide is open-ended', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:K2)'], [null, 2, 3]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 3, height: 2})
    })

    it('a wide range is not open-ended when only openEndedRangeMinRows is set', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [null, 2, 3]], {licenseKey: 'gpl-v3', openEndedRangeMinRows: 10})

      expect(engine.getSheetDimensions(0)).toEqual({width: 26, height: 2})
    })

    it('a range starting right of the cells of the sheet holds no cell', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(M2:AZ2)'], [null, 2, 3]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 3, height: 2})
    })

    it('holds no cell in a range of a sheet with thousands of columns', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(L44:XFD44)']], {licenseKey: 'gpl-v3', maxColumns: 16384, openEndedRangeMinColumns: 4096})

      expect(engine.getSheetDimensions(0)).toEqual({width: 1, height: 1})
    })

    it('a range that is both tall and wide holds no cell past the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z30)'], [null, 2, 3]], openEnded)

      expect(engine.getSheetDimensions(0)).toEqual({width: 3, height: 2})
    })
  })

  describe('values of wide ranges', () => {
    it('sums the cells of the range and leaves out the columns before it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('includes a value set right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.setCellContents(cell(engine, 'T2'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('includes a value set in the last column of the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.setCellContents(cell(engine, 'Z2'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('leaves out a value set just right of the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.setCellContents(cell(engine, 'AA2'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('includes a formula set right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.setCellContents(cell(engine, 'T2'), '=A2*10')

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('includes a value set in a range that started right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(M2:AZ2)'], [1, 2, 3]], openEnded)

      engine.setCellContents(cell(engine, 'T2'), 4)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(4)
    })

    it('includes a value set in a range that is both tall and wide', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z30)'], [1, 2, 3]], openEnded)

      engine.setCellContents(cell(engine, 'T20'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('includes an array spilled into a wide range from a cell outside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(M5:AZ5)', 1, 2]], openEnded)

      engine.setCellContents(cell(engine, 'T4'), '=ARRAYFORMULA(B1:C1*{1;2})')

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(6)
    })
  })

  describe('functions that use the full width of the range', () => {
    it('COLUMNS returns the number of columns of a wide range', () => {
      const engine = HyperFormula.buildFromArray([['=COLUMNS(B2:Z2)'], [1, 2, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(25)
    })

    it('COLUMNS returns the number of columns of a range of a sheet with thousands of columns', () => {
      const engine = HyperFormula.buildFromArray([['=COLUMNS(L44:XFD44)']], {licenseKey: 'gpl-v3', maxColumns: 16384, openEndedRangeMinColumns: 4096})

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(16373)
    })

    it('ROWS returns the number of rows of a wide range', () => {
      const engine = HyperFormula.buildFromArray([['=ROWS(B2:Z3)'], [1, 2, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('COUNTBLANK counts the columns right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:Z2)'], [1, 2, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(23)
    })

    it('COUNTBLANK counts the columns of a range when no sheet holds a cell', () => {
      const engine = HyperFormula.buildFromSheets({Sheet1: []}, openEnded)

      expect(engine.calculateFormula('=COUNTBLANK(B1:Z1)', 0)).toBe(25)
    })

    it('COUNTBLANK counts the cells past the cells of the sheet in a range that is both tall and wide', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:Z30)'], [1, 2, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(723)
    })

    it('COUNTIF counts the columns right of the cells of the sheet for a criterion that empty cells meet', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTIF(B2:Z2, "<>2")'], [1, 2, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(24)
    })

    it('SUMIFS sums the cells of columns that meet a criterion', () => {
      const engine = HyperFormula.buildFromArray([['=SUMIFS(B2:Z2, B3:Z3, "x")'], [1, 2, 3], [null, 'x', 'y']], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('SUMIFS includes a column set right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUMIFS(B2:Z2, B3:Z3, "x")'], [1, 2, 3], [null, 'x', 'y']], openEnded)

      engine.setCellContents(cell(engine, 'T2'), [[10], ['x']])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(12)
    })

    it('INDEX returns an empty value for a column right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=INDEX(B2:Z2, 1, 20)'], [1, 2, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBeNull()
    })

    it('INDEX returns the #NUM! error for a column past the range', () => {
      const engine = HyperFormula.buildFromArray([['=INDEX(B2:Z2, 1, 26)'], [1, 2, 3]], openEnded)

      expect(engine.getCellValue(cell(engine, 'A1'))).toMatchObject({type: ErrorType.NUM})
    })

    it('HLOOKUP finds a value set right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=HLOOKUP(9, B2:Z3, 2, FALSE())'], [1, 2, 3], [null, 'x', 'y']], openEnded)

      engine.setCellContents(cell(engine, 'T2'), [[9], ['far']])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe('far')
    })

    it('XLOOKUP finds a value set right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=XLOOKUP(9, B2:Z2, B3:Z3, "none")'], [1, 2, 3], [null, 'x', 'y']], openEnded)

      engine.setCellContents(cell(engine, 'T2'), [[9], ['far']])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe('far')
    })
  })

  describe('adding and removing columns and rows', () => {
    it('moves a wide range right when columns are added before it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.addColumns(0, [1, 2])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(D2:AB2)')
    })

    it('extends a wide range when columns are added inside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.addColumns(0, [2, 2])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:AB2)')
    })

    it('includes a value set in a column added inside a wide range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)
      engine.addColumns(0, [2, 2])

      engine.setCellContents(cell(engine, 'C2'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('shrinks the range when columns are removed inside it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.removeColumns(0, [2, 1])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:Y2)')
    })

    it('leaves out the cells of columns removed inside the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.removeColumns(0, [2, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(2)
    })

    it('extends a wide range when columns are added inside it right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.addColumns(0, [10, 2])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:AB2)')
    })

    it('holds no cell right of the cells of the sheet after columns were added there', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.addColumns(0, [10, 2])

      expect(engine.getSheetDimensions(0)).toEqual({width: 3, height: 2})
    })

    it('shrinks a wide range when columns are removed inside it right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.removeColumns(0, [10, 2])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B2:X2)')
    })

    it('COUNTBLANK leaves out an empty column removed inside a wide range that was created before the sheet grew', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:Z2)'], [1, 2, 3]], openEnded)
      engine.setCellContents(cell(engine, 'T4'), 7)

      engine.removeColumns(0, [9, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(22)
    })

    it('COUNTBLANK counts an empty column added inside a wide range that was created before the sheet grew', () => {
      const engine = HyperFormula.buildFromArray([['=COUNTBLANK(B2:Z2)'], [1, 2, 3]], openEnded)
      engine.setCellContents(cell(engine, 'T4'), 7)

      engine.addColumns(0, [9, 1])

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(24)
    })

    it('moves a wide range down when rows are added above it', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.addRows(0, [1, 1])

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B3:Z3)')
    })

    it('includes a value set right of the cells of the sheet after rows were added above the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)
      engine.addRows(0, [1, 1])

      engine.setCellContents(cell(engine, 'T3'), 10)

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(15)
    })

    it('holds no cell right of the cells of the sheet after rows were added inside the range', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z3)'], [1, 2, 3], [1, 2, 3]], openEnded)

      engine.addRows(0, [2, 1])

      expect(engine.getSheetDimensions(0)).toEqual({width: 3, height: 4})
    })
  })

  describe('moving cells, undo and updateConfig', () => {
    it('includes a cell moved into the range right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)', 7], [1, 2, 3]], openEnded)

      engine.moveCells({start: cell(engine, 'B1'), end: cell(engine, 'B1')}, cell(engine, 'T2'))

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(12)
    })

    it('moves a wide range when all its cells are moved', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)

      engine.moveCells({start: cell(engine, 'B2'), end: cell(engine, 'Z2')}, cell(engine, 'B5'))

      expect(engine.getCellFormula(cell(engine, 'A1'))).toBe('=SUM(B5:Z5)')
    })

    it('undoes setting a value right of the cells of the sheet', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], openEnded)
      engine.setCellContents(cell(engine, 'T2'), 10)

      engine.undo()

      expect(engine.getCellValue(cell(engine, 'A1'))).toBe(5)
    })

    it('releases the cells right of the cells of the sheet when the option is turned on', () => {
      const engine = HyperFormula.buildFromArray([['=SUM(B2:Z2)'], [1, 2, 3]], {licenseKey: 'gpl-v3'})

      engine.updateConfig({openEndedRangeMinColumns: 10})

      expect(engine.getSheetDimensions(0)).toEqual({width: 3, height: 2})
    })
  })
})
