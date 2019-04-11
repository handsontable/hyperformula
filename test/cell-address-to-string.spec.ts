import {sheetCellAddress, sheetCellAddressToString} from '../src/Cell'

describe('sheetCellAddressToString', () => {
  it('is zero based', () => {
    expect(sheetCellAddressToString(sheetCellAddress(0, 0))).toBe('A1')
  })

  it('last letter is Z', () => {
    expect(sheetCellAddressToString(sheetCellAddress(25, 0))).toBe('Z1')
    expect(sheetCellAddressToString(sheetCellAddress(26, 0))).toBe('AA1')
  })

  it('works for bigger rows', () => {
    expect(sheetCellAddressToString(sheetCellAddress(2, 122))).toBe('C123')
  })

  it('works for many letters', () => {
    expect(sheetCellAddressToString(sheetCellAddress(730, 0))).toBe('ABC1')
  })
})
