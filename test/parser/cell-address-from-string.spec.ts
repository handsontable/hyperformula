import {simpleCellAddress} from '../../src/Cell'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage, enGB} from '../../src/i18n'
import {cellAddressFromString} from '../../src/parser'
import {CellAddress} from '../../src/parser'

describe('cellAddressFromString', () => {
  it('is zero based', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'A1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(null, 0, 0))
  })

  it('works for bigger rows', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'A123', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(null, 0, 122))
  })

  it('one letter', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'Z1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(null, 25, 0))
  })

  it('last letter is Z', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'AA1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(null, 26, 0))
  })

  it('works for many letters', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'ABC1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(null, 730, 0))
  })

  it('is not case sensitive', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'abc1', simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(null, 730, 0))
  })

  it('when sheet is missing, its took from base address', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'B3', simpleCellAddress(42, 0, 0))).toEqual(CellAddress.relative(null, 1, 2))
  })

  it('can into sheets', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    const sheet1 = sheetMapping.addSheet('Sheet1')
    const sheet2 = sheetMapping.addSheet('Sheet2')
    expect(cellAddressFromString(sheetMapping.get, 'Sheet2!B3', simpleCellAddress(sheet1, 0, 0))).toEqual(CellAddress.relative(sheet2, 1, 2))
  })
})
