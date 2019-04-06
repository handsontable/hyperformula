import {absoluteCellAddress, relativeCellAddress} from '../src/Cell'
import {cellAddressFromString} from '../src/parser/ParserWithCaching'
import {SheetMapping} from '../src/SheetMapping'

describe('cellAddressFromString', () => {
  it('is zero based', () => {
    expect(cellAddressFromString(new SheetMapping(), 'A1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(0, 0))
  })

  it('works for bigger rows', () => {
    expect(cellAddressFromString(new SheetMapping(), 'A123', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(0, 122))
  })

  it('one letter', () => {
    expect(cellAddressFromString(new SheetMapping(), 'Z1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(25, 0))
  })

  it('last letter is Z', () => {
    expect(cellAddressFromString(new SheetMapping(), 'AA1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(26, 0))
  })

  it('works for many letters', () => {
    expect(cellAddressFromString(new SheetMapping(), 'ABC1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(730, 0))
  })

  it('is not case sensitive', () => {
    expect(cellAddressFromString(new SheetMapping(), 'abc1', absoluteCellAddress(0, 0))).toEqual(relativeCellAddress(730, 0))
  })
})
