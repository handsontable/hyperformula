/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import ExcelJS, {Workbook} from 'exceljs'
import {HyperFormula} from '../../src'

/**
 * Round-trip tests (import ⇄ export) for the built-in xlsx I/O (HF-107).
 *
 * These complement the unit specs for `workbookToSheets` / `sheetsToXlsx` /
 * `buildFromFile` / `toFile` by exercising the full loop end-to-end and
 * asserting on the shape that actually matters to a consumer: serialized
 * sheets and computed values.
 */
describe('xlsx round-trip (HF-107)', () => {
  it('preserves values and formulas through buildFromSheets -> toFile -> buildFromFile (dates excluded: they degrade to serial by design)', async () => {
    const sheets = {
      Sheet1: [[1, 2, '=A1+B1'], ['x', true, null]],
      Sheet2: [['=Sheet1!A1']],
    }

    const hf1 = HyperFormula.buildFromSheets(sheets, {licenseKey: 'gpl-v3'})
    const hf2 = await HyperFormula.buildFromFile(await hf1.toFile(), {licenseKey: 'gpl-v3'})

    expect(hf2.getAllSheetsSerialized()).toEqual(hf1.getAllSheetsSerialized())

    // the formula still computes after the round trip, not just round-trips as text
    expect(hf2.getSheetValues(0)[0]).toEqual([1, 2, 3])

    hf1.destroy()
    hf2.destroy()
  })

  it('is stable across a second round trip when the source is authored by ExcelJS, not buildFromArray/buildFromSheets', async () => {
    const wb = new Workbook()
    const data = wb.addWorksheet('Data')
    const other = wb.addWorksheet('Other')

    other.getCell('A1').value = 5

    data.getCell('A1').value = 10
    data.getCell('B1').value = {formula: 'A1+1', result: 11} as unknown as number
    data.getCell('C1').value = {formula: 'Other!A1', result: 5} as unknown as number
    // best-effort: an error cell falls back to its text on import (see workbookToSheets)
    data.getCell('D1').value = {error: '#DIV/0!'} as unknown as string

    const bytes = await wb.xlsx.writeBuffer() as unknown as Uint8Array

    const hf = await HyperFormula.buildFromFile(bytes, {licenseKey: 'gpl-v3'})
    const hf2 = await HyperFormula.buildFromFile(await hf.toFile(), {licenseKey: 'gpl-v3'})

    // sanity: the ExcelJS-authored content actually landed where expected
    expect(hf.getAllSheetsSerialized()).toEqual({
      Data: [[10, '=A1+1', '=Other!A1', '#DIV/0!']],
      Other: [[5]],
    })

    // import -> export -> import is stable for that content
    expect(hf2.getAllSheetsSerialized()).toEqual(hf.getAllSheetsSerialized())
    expect(hf2.getSheetValues(0)).toEqual(hf.getSheetValues(0))

    hf.destroy()
    hf2.destroy()
  })

  it('does not round-trip cell formatting (fill/font/numFmt), proving the lossy contract is intentional', async () => {
    const wb = new Workbook()
    const ws = wb.addWorksheet('Data')
    const cell = ws.getCell('A1')

    cell.value = 1234.5
    cell.numFmt = '#,##0.00'
    cell.font = {bold: true, color: {argb: 'FFFF0000'}}
    cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFFFFF00'}}

    const sourceBytes = await wb.xlsx.writeBuffer() as unknown as Uint8Array

    const hf = await HyperFormula.buildFromFile(sourceBytes, {licenseKey: 'gpl-v3'})
    const roundTripBytes = await hf.toFile()

    const reloaded = new ExcelJS.Workbook()
    await reloaded.xlsx.load(roundTripBytes as never)
    const reloadedCell = reloaded.getWorksheet('Data')!.getCell('A1')

    // the value survived...
    expect(reloadedCell.value).toBe(1234.5)

    // ...but none of the formatting did (best-effort: tolerant of either
    // "unset" representation ExcelJS may use for a never-styled cell)
    expect(reloadedCell.numFmt === undefined || reloadedCell.numFmt === 'General').toBe(true)
    expect(reloadedCell.fill).toBeUndefined()
    expect(reloadedCell.font?.bold).not.toBe(true)

    hf.destroy()
  })
})
