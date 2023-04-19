import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage} from '../../src/i18n'
import {enGB} from '../../src/i18n/languages'
import {CellAddress, cellAddressFromString} from '../../src/parser'
import {adr} from '../testUtils'

describe('cellAddressFromString', () => {
  it('is zero based', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'A1', adr('A1'))).toEqual(CellAddress.relative(0, 0))
  })

  it('works for bigger rows', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'A123', adr('A1'))).toEqual(CellAddress.relative(0, 122))
  })

  it('one letter', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'Z1', adr('A1'))).toEqual(CellAddress.relative(25, 0))
  })

  it('last letter is Z', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'AA1', adr('A1'))).toEqual(CellAddress.relative(26, 0))
  })

  it('works for many letters', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'ABC1', adr('A1'))).toEqual(CellAddress.relative(730, 0))
  })

  it('is not case sensitive', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'abc1', adr('A1'))).toEqual(CellAddress.relative(730, 0))
  })

  it('when sheet is missing, its took from base address', () => {
    expect(cellAddressFromString(new SheetMapping(buildTranslationPackage(enGB)).get, 'B3', adr('A1', 42))).toEqual(CellAddress.relative(1, 2))
  })

  it('can into sheets', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    const sheet1 = sheetMapping.addSheet('Sheet1')
    const sheet2 = sheetMapping.addSheet('Sheet2')
    const sheet3 = sheetMapping.addSheet('~`!@#$%^&*()_-+_=/|?{}[]\"')

    expect(cellAddressFromString(sheetMapping.get, 'Sheet1!B3', adr('A1', sheet1))).toEqual(CellAddress.relative(1, 2, sheet1))
    expect(cellAddressFromString(sheetMapping.get, 'Sheet2!B3', adr('A1', sheet1))).toEqual(CellAddress.relative(1, 2, sheet2))
    expect(cellAddressFromString(sheetMapping.get, "'~`!@#$%^&*()_-+_=/|?{}[]\"'!B3", adr('A1', sheet1))).toEqual(CellAddress.relative(1, 2, sheet3))
  })
})
