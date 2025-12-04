import { AlwaysDense } from '../../../src'
import {AddressMapping, SheetMapping, SheetReferenceRegistrar} from '../../../src/DependencyGraph'
import {buildTranslationPackage} from '../../../src/i18n'
import {enGB} from '../../../src/i18n/languages'
import {CellAddress, cellAddressFromString} from '../../../src/parser'
import {adr} from '../testUtils'

describe('cellAddressFromString', () => {
  let sheetMapping: SheetMapping
  let addressMapping: AddressMapping
  let resolveSheetReference: (sheetName: string) => number
  beforeEach(() => {
    sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    addressMapping = new AddressMapping(new AlwaysDense())
    const registrar = new SheetReferenceRegistrar(sheetMapping, addressMapping)
    resolveSheetReference = registrar.ensureSheetRegistered.bind(registrar)
  })

  it('is zero based', () => {
    expect(cellAddressFromString('A1', adr('A1'), resolveSheetReference)).toEqual(CellAddress.relative(0, 0))
  })

  it('works for bigger rows', () => {
    expect(cellAddressFromString('A123', adr('A1'), resolveSheetReference)).toEqual(CellAddress.relative(0, 122))
  })

  it('one letter', () => {
    expect(cellAddressFromString('Z1', adr('A1'), resolveSheetReference)).toEqual(CellAddress.relative(25, 0))
  })

  it('last letter is Z', () => {
    expect(cellAddressFromString('AA1', adr('A1'), resolveSheetReference)).toEqual(CellAddress.relative(26, 0))
  })

  it('works for many letters', () => {
    expect(cellAddressFromString('ABC1', adr('A1'), resolveSheetReference)).toEqual(CellAddress.relative(730, 0))
  })

  it('is not case sensitive', () => {
    expect(cellAddressFromString('abc1', adr('A1'), resolveSheetReference)).toEqual(CellAddress.relative(730, 0))
  })

  it('when sheet is missing, its took from base address', () => {
    expect(cellAddressFromString('B3', adr('A1', 42), resolveSheetReference)).toEqual(CellAddress.relative(1, 2))
  })

  it('can into sheets', () => {
    const sheet1 = sheetMapping.addSheet('Sheet1')
    const sheet2 = sheetMapping.addSheet('Sheet2')
    const sheet3 = sheetMapping.addSheet('~`!@#$%^&*()_-+_=/|?{}[]\"')

    expect(cellAddressFromString('Sheet1!B3', adr('A1', sheet1), resolveSheetReference)).toEqual(CellAddress.relative(1, 2, sheet1))
    expect(cellAddressFromString('Sheet2!B3', adr('A1', sheet1), resolveSheetReference)).toEqual(CellAddress.relative(1, 2, sheet2))
    expect(cellAddressFromString("'~`!@#$%^&*()_-+_=/|?{}[]\"'!B3", adr('A1', sheet1), resolveSheetReference)).toEqual(CellAddress.relative(1, 2, sheet3))
  })
})
