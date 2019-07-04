import {simpleCellAddress} from '../src/Cell'
import {CellAddress} from '../src/parser/CellAddress'
import {cellAddressFromString} from '../src/parser'
import {SheetMapping} from '../src/DependencyGraph'

describe('cellAddressFromString', () => {
  it('is zero based', () => {
    expect(cellAddressFromString(new SheetMapping().fetch, 'A1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 0, 0))
  })

  it('works for bigger rows', () => {
    expect(cellAddressFromString(new SheetMapping().fetch, 'A123', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 0, 122))
  })

  it('one letter', () => {
    expect(cellAddressFromString(new SheetMapping().fetch, 'Z1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 25, 0))
  })

  it('last letter is Z', () => {
    expect(cellAddressFromString(new SheetMapping().fetch, 'AA1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 26, 0))
  })

  it('works for many letters', () => {
    expect(cellAddressFromString(new SheetMapping().fetch, 'ABC1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 730, 0))
  })

  it('is not case sensitive', () => {
    expect(cellAddressFromString(new SheetMapping().fetch, 'abc1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 730, 0))
  })

  it('when sheet is missing, its took from base address', () => {
    expect(cellAddressFromString(new SheetMapping().fetch, 'B3', simpleCellAddress(42, 0, 0))).toEqual(CellAddress.relative(42, 1, 2))
  })

  it('can into sheets', () => {
    const sheetMapping = new SheetMapping()
    const sheet1 = sheetMapping.addSheet('Sheet1')
    const sheet2 = sheetMapping.addSheet('Sheet2')
    expect(cellAddressFromString(sheetMapping.fetch, '$Sheet2.B3', simpleCellAddress(sheet1, 0, 0))).toEqual(CellAddress.relative(sheet2, 1, 2))
  })
})
