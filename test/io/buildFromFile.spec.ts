import {Workbook} from 'exceljs'
import {HyperFormula} from '../../src'
import {UnsupportedFileError} from '../../src/errors'

/** Builds an xlsx buffer in memory (Sheet1!A1 = 1, Sheet1!B1 = '=A1+1'). */
async function singleSheetBuffer(): Promise<Uint8Array> {
  const wb = new Workbook()
  const ws = wb.addWorksheet('Sheet1')
  ws.getCell('A1').value = 1
  ws.getCell('B1').value = {formula: 'A1+1', result: 2} as unknown as number
  const buf = await wb.xlsx.writeBuffer()
  return buf as unknown as Uint8Array
}

/** Builds an xlsx buffer with two named worksheets. */
async function twoSheetBuffer(): Promise<Uint8Array> {
  const wb = new Workbook()
  wb.addWorksheet('Data')
  wb.addWorksheet('Summary')
  const buf = await wb.xlsx.writeBuffer()
  return buf as unknown as Uint8Array
}

/** Copies a Uint8Array's bytes into a fresh, standalone ArrayBuffer. */
function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(data.length)
  copy.set(data)
  return copy.buffer
}

describe('HyperFormula.buildFromFile', () => {
  it('imports a sheet and evaluates formulas end-to-end', async () => {
    const data = await singleSheetBuffer()

    const hf = await HyperFormula.buildFromFile(data, {licenseKey: 'gpl-v3'})

    expect(hf.getSheetSerialized(0)[0][1]).toBe('=A1+1')
    expect(hf.getSheetValues(0)[0]).toEqual([1, 2])

    hf.destroy()
  })

  it('imports every worksheet name from a multi-sheet workbook', async () => {
    const data = await twoSheetBuffer()

    const hf = await HyperFormula.buildFromFile(data, {licenseKey: 'gpl-v3'})

    const names = hf.getSheetNames()

    expect(names).toContain('Data')
    expect(names).toContain('Summary')

    hf.destroy()
  })

  it('builds equivalent engines from the same bytes as Uint8Array and as ArrayBuffer', async () => {
    const bytes = await singleSheetBuffer()
    const arrayBuffer = toArrayBuffer(bytes)

    const hfFromBytes = await HyperFormula.buildFromFile(bytes, {licenseKey: 'gpl-v3'})
    const hfFromArrayBuffer = await HyperFormula.buildFromFile(arrayBuffer, {licenseKey: 'gpl-v3'})

    expect(hfFromArrayBuffer.getSheetSerialized(0)).toEqual(hfFromBytes.getSheetSerialized(0))
    expect(hfFromArrayBuffer.getSheetValues(0)).toEqual(hfFromBytes.getSheetValues(0))

    hfFromBytes.destroy()
    hfFromArrayBuffer.destroy()
  })

  it('rejects garbage bytes with UnsupportedFileError', async () => {
    let err: unknown
    try {
      await HyperFormula.buildFromFile(new Uint8Array([1, 2, 3, 4, 5]), {licenseKey: 'gpl-v3'})
    } catch (e) {
      err = e
    }

    expect(err instanceof UnsupportedFileError).toBe(true)
    expect((err as UnsupportedFileError).reason).toBe('unparseable')
  })

  it('builds independent, non-shared engines when run concurrently', async () => {
    const wbA = new Workbook()
    wbA.addWorksheet('Sheet1').getCell('A1').value = 'A'
    const bufA = await wbA.xlsx.writeBuffer() as unknown as Uint8Array

    const wbB = new Workbook()
    wbB.addWorksheet('Sheet1').getCell('A1').value = 'B'
    const bufB = await wbB.xlsx.writeBuffer() as unknown as Uint8Array

    const [hfA, hfB] = await Promise.all([
      HyperFormula.buildFromFile(bufA, {licenseKey: 'gpl-v3'}),
      HyperFormula.buildFromFile(bufB, {licenseKey: 'gpl-v3'}),
    ])

    expect(hfA.getSheetValues(0)).toEqual([['A']])
    expect(hfB.getSheetValues(0)).toEqual([['B']])

    hfA.destroy()
    hfB.destroy()
  })
})
