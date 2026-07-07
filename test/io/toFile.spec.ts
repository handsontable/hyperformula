import ExcelJS from 'exceljs'
import {HyperFormula} from '../../src'

describe('HyperFormula#toFile', () => {
  it('exports a live engine to loadable xlsx bytes, preserving a formula', async () => {
    const hf = HyperFormula.buildFromSheets({Sheet1: [[1, '=A1+1']]}, {licenseKey: 'gpl-v3'})

    const bytes = await hf.toFile()

    expect(bytes instanceof Uint8Array).toBe(true)
    expect(bytes.length).toBeGreaterThan(0)

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(bytes as never)
    const ws = wb.getWorksheet('Sheet1')!

    expect(ws.getCell('A1').value).toBe(1)
    expect(ws.getCell('B1').formula).toBe('A1+1')

    hf.destroy()
  })

  it('exports an empty engine to a valid, loadable xlsx file', async () => {
    const hf = HyperFormula.buildEmpty({licenseKey: 'gpl-v3'})

    const bytes = await hf.toFile()

    expect(bytes instanceof Uint8Array).toBe(true)

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(bytes as never)

    expect(wb.worksheets.length).toBe(0)

    hf.destroy()
  })
})
