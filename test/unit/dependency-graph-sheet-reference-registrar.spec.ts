import { AlwaysDense } from '../../src'
import {AddressMapping, SheetMapping, SheetReferenceRegistrar} from '../../src/DependencyGraph'
import {buildTranslationPackage} from '../../src/i18n'
import {enGB} from '../../src/i18n/languages'

describe('SheetReferenceRegistrar', () => {
  it('reserves sheet and seeds address mapping strategy once', () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    const addressMapping = new AddressMapping(new AlwaysDense())
    const registrar = new SheetReferenceRegistrar(sheetMapping, addressMapping)

    const firstSheetId = registrar.ensureSheetRegistered('Ghost')
    const secondSheetId = registrar.ensureSheetRegistered('Ghost')

    expect(firstSheetId).toBe(secondSheetId)
    expect(sheetMapping.getSheetId('Ghost', {includeNotAdded: true})).toBe(firstSheetId)
    expect(() => addressMapping.getStrategyForSheet(firstSheetId)).not.toThrow()
  })
})
