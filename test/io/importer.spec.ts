import ExcelJS, {Workbook, Worksheet} from 'exceljs'
import {workbookToSheets} from '../../src/io/xlsx/importer'
import {Sheets} from '../../src/Sheet'

/**
 * Builds a worksheet via `build`, then writes and reloads the workbook through
 * ExcelJS so formulas come back in their real stored form (e.g. `_xlfn.`
 * prefixes, per-cell-rebased shared formulas) rather than the in-memory form
 * that a directly-constructed cell may not exhibit.
 */
async function roundTripSheet(build: (ws: Worksheet) => void): Promise<Sheets> {
  const wb = new ExcelJS.Workbook()
  build(wb.addWorksheet('S1'))
  const buf = await wb.xlsx.writeBuffer()
  const wb2 = new ExcelJS.Workbook()
  await wb2.xlsx.load(buf as never)
  return workbookToSheets(wb2)
}

describe('workbookToSheets', () => {
  it('keys the result by worksheet name, preserving multiple sheets', () => {
    const wb = new Workbook()
    wb.addWorksheet('Data')
    wb.addWorksheet('Summary')

    const sheets = workbookToSheets(wb)

    expect(Object.keys(sheets).sort()).toEqual(['Data', 'Summary'])
  })

  it('maps number, string, boolean and blank cells to the right primitives at the right coordinates', () => {
    const wb = new Workbook()
    const ws = wb.addWorksheet('Data')
    ws.getCell('A1').value = 1
    ws.getCell('B1').value = 'hi'
    ws.getCell('A2').value = true
    // B2 left blank on purpose

    const sheets = workbookToSheets(wb)

    expect(sheets.Data[0][0]).toBe(1)
    expect(sheets.Data[0][1]).toBe('hi')
    expect(sheets.Data[1][0]).toBe(true)
    expect(sheets.Data[1][1]).toBe(null)
  })

  it('maps a formula cell to a string formula prefixed with =', () => {
    const wb = new Workbook()
    const ws = wb.addWorksheet('Data')
    ws.getCell('A1').value = 1
    ws.getCell('B2').value = {formula: 'A1+1', result: 2} as unknown as number

    const sheets = workbookToSheets(wb)

    expect(sheets.Data[1][1]).toBe('=A1+1')
  })

  it('passes a Date cell through as a Date (best-effort)', () => {
    const wb = new Workbook()
    const ws = wb.addWorksheet('Data')
    const date = new Date(2024, 0, 1)
    ws.getCell('A1').value = date

    const sheets = workbookToSheets(wb)

    expect(sheets.Data[0][0] instanceof Date).toBe(true)
    expect((sheets.Data[0][0] as Date).getTime()).toBe(date.getTime())
  })

  it('renders an object-valued error cell via cell.text, never the raw object', () => {
    const wb = new Workbook()
    const ws = wb.addWorksheet('Data')
    ws.getCell('A1').value = {error: '#DIV/0!'} as unknown as string

    const sheets = workbookToSheets(wb)

    expect(sheets.Data[0][0]).toBe('#DIV/0!')
    expect(typeof sheets.Data[0][0]).toBe('string')
  })

  it('maps an empty worksheet to an empty array', () => {
    const wb = new Workbook()
    wb.addWorksheet('Empty')

    const sheets = workbookToSheets(wb)

    expect(sheets.Empty).toEqual([])
  })
})

describe('workbookToSheets - formula dialect normalization (HF-107)', () => {
  it('strips the _xlfn. prefix Excel adds for newer functions', async () => {
    const sheets = await roundTripSheet(ws => {
      ws.getCell('A1').value = 1
      ws.getCell('A2').value = 2
      ws.getCell('A3').value = 3
      ws.getCell('C1').value = {formula: '_xlfn.XLOOKUP(1,A1:A3,A1:A3)', result: 1} as unknown as number
    })

    expect(sheets.S1[0][2]).toBe('=XLOOKUP(1,A1:A3,A1:A3)')
  })

  it('strips both _xlfn. and _xlws. when a formula carries the combined prefix', async () => {
    const sheets = await roundTripSheet(ws => {
      ws.getCell('A1').value = 1
      ws.getCell('C1').value = {formula: '_xlfn._xlws.ANCHORARRAY(A1)', result: 1} as unknown as number
    })

    expect(sheets.S1[0][2]).toBe('=ANCHORARRAY(A1)')
  })

  it('imports a shared formula group with each cell already rebased to its own row (no rebasing logic needed)', async () => {
    const sheets = await roundTripSheet(ws => {
      ws.getCell('A1').value = 1
      ws.getCell('A2').value = 2
      ws.getCell('A3').value = 3
      ws.fillFormula('B1:B3', 'A1*2', [2, 4, 6])
    })

    expect(sheets.S1[0][1]).toBe('=A1*2')
    expect(sheets.S1[1][1]).toBe('=A2*2')
    expect(sheets.S1[2][1]).toBe('=A3*2')
  })

  it('passes a cross-sheet, quoted-name reference through verbatim', async () => {
    const wb = new ExcelJS.Workbook()
    const other = wb.addWorksheet('My Sheet')
    other.getCell('A1').value = 42
    const s1 = wb.addWorksheet('S1')
    s1.getCell('D1').value = {formula: "'My Sheet'!A1", result: 42} as unknown as number

    const buf = await wb.xlsx.writeBuffer()
    const wb2 = new ExcelJS.Workbook()
    await wb2.xlsx.load(buf as never)
    const sheets = workbookToSheets(wb2)

    expect(sheets.S1[0][3]).toBe("='My Sheet'!A1")
  })
})
