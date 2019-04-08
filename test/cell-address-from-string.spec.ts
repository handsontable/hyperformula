import {cellAddressFromString, relativeCellAddress, simpleCellAddress} from '../src/Cell'
import {SheetMapping} from '../src/SheetMapping'

describe('cellAddressFromString', () => {
  it('is zero based', () => {
    expect(cellAddressFromString(new SheetMapping(), 'A1', simpleCellAddress(0, 0, 0))).toEqual(relativeCellAddress(0, 0, 0))
  })

  it('works for bigger rows', () => {
    expect(cellAddressFromString(new SheetMapping(), 'A123', simpleCellAddress(0, 0, 0))).toEqual(relativeCellAddress(0, 0, 122))
  })

  it('one letter', () => {
    expect(cellAddressFromString(new SheetMapping(), 'Z1', simpleCellAddress(0, 0, 0))).toEqual(relativeCellAddress(0, 25, 0))
  })

  it('last letter is Z', () => {
    expect(cellAddressFromString(new SheetMapping(), 'AA1', simpleCellAddress(0, 0, 0))).toEqual(relativeCellAddress(0, 26, 0))
  })

  it('works for many letters', () => {
    expect(cellAddressFromString(new SheetMapping(), 'ABC1', simpleCellAddress(0, 0, 0))).toEqual(relativeCellAddress(0, 730, 0))
  })

  it('is not case sensitive', () => {
    expect(cellAddressFromString(new SheetMapping(), 'abc1', simpleCellAddress(0, 0, 0))).toEqual(relativeCellAddress(0, 730, 0))
  })

  it('when sheet is missing, its took from base address', () => {
    expect(cellAddressFromString(new SheetMapping(), 'B3', simpleCellAddress(42, 0, 0))).toEqual(relativeCellAddress(42, 1, 2))
  })

  it('can into sheets', () => {
    const sheetMapping = new SheetMapping()
    const sheet1 = sheetMapping.addSheet('Sheet1')
    const sheet2 = sheetMapping.addSheet('Sheet2')
    expect(cellAddressFromString(sheetMapping, '$Sheet2.B3', simpleCellAddress(sheet1, 0, 0))).toEqual(relativeCellAddress(sheet2, 1, 2))
  })
})
