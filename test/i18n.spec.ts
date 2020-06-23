
import {HyperFormula, LanguageAlreadyRegisteredError, LanguageNotRegisteredError} from '../src'
import {RawTranslationPackage, TranslationPackage} from '../src/i18n'
import {enGB, plPL} from '../src/i18n/languages'
import {CellAddress} from '../src/parser'
import {adr, extractReference} from './testUtils'
import {FunctionRegistry} from '../src/interpreter/FunctionRegistry'
import {ProtectedFunctionTranslationError} from '../src/errors'

describe('i18n', () => {
  const languages: Record<string, RawTranslationPackage> = {
    enGB,
    plPL,
  }

  beforeEach(() => {
    HyperFormula.registerLanguage('plPL', plPL)
  })

  it('using functions in different languages', () => {
    const enginePL = HyperFormula.buildFromArray([
      ['=SUMA(42)'],
    ], {language: 'plPL'})
    const engineEN = HyperFormula.buildFromArray([
      ['=SUM(42)'],
    ], {language: 'enGB'})

    expect(enginePL.getCellValue(adr('A1'))).toBe(42)
    expect(engineEN.getCellValue(adr('A1'))).toBe(42)
  })

  it('using functions in different languages with not standard characters', () => {
    const enginePL = HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['2'],
      ['=LICZ.JEŻELI(A1:A3, ">=1")'],
    ], {language: 'plPL'})
    const engineEN = HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['2'],
      ['=COUNTIF(A1:A3, ">=1")'],
    ], {language: 'enGB'})

    expect(enginePL.getCellValue(adr('A4'))).toBe(2)
    expect(engineEN.getCellValue(adr('A4'))).toBe(2)
  })

  it('translation works for parser hardcoded offset procedure', () => {
    const enginePL = HyperFormula.buildFromArray([
      ['=PRZESUNIĘCIE(A1, 1, 1)'],
    ], {language: 'plPL'})
    const engineEN = HyperFormula.buildFromArray([
      ['=OFFSET(A1, 1, 1)'],
    ])

    expect(extractReference(enginePL, adr('A1'))).toEqual(CellAddress.relative(null, 1, 1))
    expect(extractReference(engineEN, adr('A1'))).toEqual(CellAddress.relative(null, 1, 1))
  })

  it('all function translation keys has to be upper cased', () => {
    for (const lang in languages) {
      const translationPackage = languages[lang]
      for (const translationKey in translationPackage.functions) {
        expect(translationPackage.functions[translationKey]).toEqual(translationPackage.functions[translationKey].toUpperCase())
      }
    }
  })

  it('all translation packages should not include protected function definition', () => {
    for (const lang in languages) {
      const translatedFunctionsInLang = new Set(Object.keys(languages[lang].functions))
      expect(translatedFunctionsInLang.has('VERSION')).toEqual(false)
    }
  })

  it('all translation packages should translate all implemented functions', () => {
    const implementedFunctions = new Set(Array.from(FunctionRegistry.getRegisteredFunctionIds()))

    for (const lang in languages) {
      const translatedFunctionsInLang = new Set(Object.keys(languages[lang].functions))
      translatedFunctionsInLang.add('VERSION') /* missing protected function */
      expect(translatedFunctionsInLang).toEqual(implementedFunctions)
    }
  })

  it('translation package sanitization', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new TranslationPackage({}, {}, {})).toThrowError()
  })

  it('should not be possible to construct TranslationPackage with protected translation', () => {
    expect(() =>
      new TranslationPackage({'VERSION': 'FOO'}, plPL.errors, plPL.ui)
    ).toThrow(new ProtectedFunctionTranslationError('VERSION'))
  })

  it('should not be possible to extend TranslationPackage with protected translation', () => {
    const translationPackage = HyperFormula.getLanguage('plPL')
    expect(() =>
      translationPackage.extendFunctions({'VERSION': 'FOO'})
    ).toThrow(new ProtectedFunctionTranslationError('VERSION'))
  })

  it('should not be possible to register language with protected translation', () => {
    const rawTranslationPackage: RawTranslationPackage = {
      ...plPL,
      functions: {'VERSION': 'FOO'}
    }

    expect(() =>
      HyperFormula.registerLanguage('foo', rawTranslationPackage)
    ).toThrow(new ProtectedFunctionTranslationError('VERSION'))
  })

  it('should throw error when trying to register same language twice', () => {
    expect(() =>
      HyperFormula.registerLanguage('plPL', plPL)
    ).toThrow(new LanguageAlreadyRegisteredError())
  })

  it('should throw error when trying to unregister not registered language', () => {
    expect(() =>
      HyperFormula.unregisterLanguage('foo')
    ).toThrow(new LanguageNotRegisteredError())
  })

  it('should throw error when trying to retrieve not registered language', () => {
    expect(() =>
      HyperFormula.getLanguage('foo')
    ).toThrow(new LanguageNotRegisteredError())
  })
})
