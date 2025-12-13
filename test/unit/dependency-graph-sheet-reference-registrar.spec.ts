import { AlwaysDense } from '../../src'
import {AddressMapping, DenseStrategy, SheetMapping, SheetReferenceRegistrar} from '../../src/DependencyGraph'
import {buildTranslationPackage} from '../../src/i18n'
import {enGB} from '../../src/i18n/languages'

describe('SheetReferenceRegistrar', () => {
  const createDependencies = () => {
    const sheetMapping = new SheetMapping(buildTranslationPackage(enGB))
    const addressMapping = new AddressMapping(new AlwaysDense())
    const registrar = new SheetReferenceRegistrar(sheetMapping, addressMapping)
    return { sheetMapping, addressMapping, registrar }
  }

  it('when called with non-existing sheet, adds a placeholder', () => {
    const { sheetMapping, addressMapping, registrar } = createDependencies()

    const sheetId = registrar.ensureSheetRegistered('NewSheet')

    expect(sheetMapping.numberOfSheets({ includePlaceholders: true })).toBe(1)
    expect(sheetMapping.hasSheetWithId(sheetId, { includePlaceholders: true })).toBe(true)
    expect(() => addressMapping.getStrategyForSheetOrThrow(sheetId)).not.toThrow()
  })

  it('when called with existing placeholder sheet, doesnt modify address mapping nor sheet mapping', () => {
    const { sheetMapping, addressMapping, registrar } = createDependencies()
    const firstSheetId = registrar.ensureSheetRegistered('PlaceholderSheet')

    const secondSheetId = registrar.ensureSheetRegistered('PlaceholderSheet')

    expect(secondSheetId).toBe(firstSheetId)
    expect(sheetMapping.numberOfSheets({ includePlaceholders: true })).toBe(1)
    expect(() => addressMapping.getStrategyForSheetOrThrow(firstSheetId)).not.toThrow()
  })

  it('when called with existing real sheet, doesnt modify address mapping nor sheet mapping', () => {
    const { sheetMapping, addressMapping, registrar } = createDependencies()
    const realSheetId = sheetMapping.addSheet('RealSheet')
    addressMapping.addSheetWithStrategy(realSheetId, new DenseStrategy(0, 0))

    const returnedSheetId = registrar.ensureSheetRegistered('RealSheet')

    expect(returnedSheetId).toBe(realSheetId)
    expect(sheetMapping.numberOfSheets({ includePlaceholders: true })).toBe(1)
    expect(sheetMapping.numberOfSheets({ includePlaceholders: false })).toBe(1)
    expect(() => addressMapping.getStrategyForSheetOrThrow(realSheetId)).not.toThrow()
  })

  it('when called with name that differs from some placeholder sheet only by case, doesnt modify address mapping nor sheet mapping', () => {
    const { sheetMapping, addressMapping, registrar } = createDependencies()
    const firstSheetId = registrar.ensureSheetRegistered('PlaceholderSheet')

    const secondSheetId = registrar.ensureSheetRegistered('PLACEHOLDERSHEET')

    expect(secondSheetId).toBe(firstSheetId)
    expect(secondSheetId).toBe(firstSheetId)
    expect(sheetMapping.numberOfSheets({ includePlaceholders: true })).toBe(1)
    expect(() => addressMapping.getStrategyForSheetOrThrow(firstSheetId)).not.toThrow()
  })

  it('when called with name that differs from some real sheet only by case, doesnt modify address mapping nor sheet mapping', () => {
    const { sheetMapping, addressMapping, registrar } = createDependencies()
    const realSheetId = sheetMapping.addSheet('RealSheet')
    addressMapping.addSheetWithStrategy(realSheetId, new DenseStrategy(0, 0))

    const returnedSheetId = registrar.ensureSheetRegistered('REALSHEET')

    expect(returnedSheetId).toBe(realSheetId)
    expect(sheetMapping.numberOfSheets({ includePlaceholders: true })).toBe(1)
    expect(sheetMapping.numberOfSheets({ includePlaceholders: false })).toBe(1)
    expect(() => addressMapping.getStrategyForSheetOrThrow(realSheetId)).not.toThrow()
  })
})
