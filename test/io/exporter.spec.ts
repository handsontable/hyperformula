import ExcelJS, {Workbook} from 'exceljs'
import {sheetsToXlsx} from '../../src/io/xlsx/exporter'

/** Loads exported bytes back into a fresh ExcelJS {@link Workbook} for assertions. */
async function reload(bytes: Uint8Array): Promise<Workbook> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(bytes as never)
  return wb
}

describe('sheetsToXlsx', () => {
  it('returns a non-empty Uint8Array', async () => {
    const bytes = await sheetsToXlsx({Sheet1: [[1]]})

    expect(bytes instanceof Uint8Array).toBe(true)
    expect(bytes.length).toBeGreaterThan(0)
  })

  it('writes a formula cell as a formula and a plain value at the right coordinates', async () => {
    const bytes = await sheetsToXlsx({Sheet1: [['=A1+1', 5]]})

    const wb = await reload(bytes)
    const ws = wb.getWorksheet('Sheet1')!

    expect(ws.getCell('A1').formula).toBe('A1+1')
    expect(ws.getCell('B1').value).toBe(5)
  })

  it('leaves a null cell blank on reload, not 0 or empty string', async () => {
    const bytes = await sheetsToXlsx({Sheet1: [[1, null, 'x']]})

    const wb = await reload(bytes)
    const ws = wb.getWorksheet('Sheet1')!

    const blank = ws.getCell('B1').value

    expect(blank === null || blank === undefined).toBe(true)
  })

  it('creates one worksheet per input sheet, preserving names', async () => {
    const bytes = await sheetsToXlsx({Data: [[1]], Summary: [[2]]})

    const wb = await reload(bytes)

    expect(wb.getWorksheet('Data')).toBeTruthy()
    expect(wb.getWorksheet('Summary')).toBeTruthy()
  })

  it('writes a Date value as a Date on reload (best-effort)', async () => {
    const date = new Date(2024, 0, 1)
    const bytes = await sheetsToXlsx({Sheet1: [[date]]})

    const wb = await reload(bytes)
    const ws = wb.getWorksheet('Sheet1')!
    const value = ws.getCell('A1').value

    expect(value instanceof Date).toBe(true)
    expect((value as Date).getTime()).toBe(date.getTime())
  })

  it('writes a boolean value through as a boolean', async () => {
    const bytes = await sheetsToXlsx({Sheet1: [[true, false]]})

    const wb = await reload(bytes)
    const ws = wb.getWorksheet('Sheet1')!

    expect(ws.getCell('A1').value).toBe(true)
    expect(ws.getCell('B1').value).toBe(false)
  })

  it('produces a loadable file for an empty sheets map (an engine with zero sheets)', async () => {
    const bytes = await sheetsToXlsx({})

    const wb = await reload(bytes)

    expect(wb.worksheets.length).toBe(0)
  })
})
