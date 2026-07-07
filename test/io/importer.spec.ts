import {Workbook} from 'exceljs'
import {workbookToSheets} from '../../src/io/xlsx/importer'

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
