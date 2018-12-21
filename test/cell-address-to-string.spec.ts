import {cellAddressToString, simpleCellAddress} from '../src/Cell'

describe('cellAddressToString', () => {
  it('is zero based', () => {
    expect(cellAddressToString(simpleCellAddress(0, 0))).toBe('A1')
  })

  it('last letter is Z', () => {
    expect(cellAddressToString(simpleCellAddress(25, 0))).toBe('Z1')
    expect(cellAddressToString(simpleCellAddress(26, 0))).toBe('AA1')
  })

  it('works for bigger rows', () => {
    expect(cellAddressToString(simpleCellAddress(2, 122))).toBe('C123')
  })

  it('works for many letters', () => {
    expect(cellAddressToString(simpleCellAddress(730, 0))).toBe('ABC1')
  })
})
