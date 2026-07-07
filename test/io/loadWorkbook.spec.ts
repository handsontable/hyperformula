import {Workbook} from 'exceljs'
import {UnsupportedFileError} from '../../src/errors'
import {loadXlsxWorkbook} from '../../src/io/xlsx/loadWorkbook'

/** Builds a minimal valid xlsx file in memory (Sheet1!A1 = 42). */
async function xlsxBuffer(): Promise<Uint8Array> {
  const wb = new Workbook()
  const ws = wb.addWorksheet('Sheet1')
  ws.getCell('A1').value = 42
  const buf = await wb.xlsx.writeBuffer()
  return buf as unknown as Uint8Array
}

describe('loadXlsxWorkbook', () => {
  it('loads a valid xlsx buffer into a Workbook', async () => {
    const data = await xlsxBuffer()

    const wb = await loadXlsxWorkbook(data)

    const ws = wb.getWorksheet('Sheet1')

    expect(ws?.getCell('A1').value).toBe(42)
  })

  it('rejects an empty Uint8Array with UnsupportedFileError(empty)', async () => {
    let err: unknown
    try {
      await loadXlsxWorkbook(new Uint8Array(0))
    } catch (e) {
      err = e
    }

    expect(err instanceof UnsupportedFileError).toBe(true)
    expect((err as UnsupportedFileError).reason).toBe('empty')
  })

  it('rejects an empty ArrayBuffer with UnsupportedFileError(empty)', async () => {
    let err: unknown
    try {
      await loadXlsxWorkbook(new ArrayBuffer(0))
    } catch (e) {
      err = e
    }

    expect(err instanceof UnsupportedFileError).toBe(true)
    expect((err as UnsupportedFileError).reason).toBe('empty')
  })

  it('rejects garbage bytes with UnsupportedFileError(unparseable)', async () => {
    let err: unknown
    try {
      await loadXlsxWorkbook(new Uint8Array([1, 2, 3, 4, 5]))
    } catch (e) {
      err = e
    }

    expect(err instanceof UnsupportedFileError).toBe(true)
    expect((err as UnsupportedFileError).reason).toBe('unparseable')
  })

  it('loads correctly from a subarray view with a non-zero byteOffset', async () => {
    const xlsx = await xlsxBuffer()
    const offset = 7
    const big = new Uint8Array(offset + xlsx.length + 3)
    big.set(xlsx, offset)
    const view = big.subarray(offset, offset + xlsx.length)

    const wb = await loadXlsxWorkbook(view)

    const ws = wb.getWorksheet('Sheet1')

    expect(ws?.getCell('A1').value).toBe(42)
  })
})
