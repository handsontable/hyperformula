import {HyperFormula} from '../src'
import {Config} from '../src/Config'
import {languages, plPL, TranslationPackage} from '../src/i18n'
import {CellAddress} from '../src/parser'
import {adr, extractReference} from './testUtils'

describe('i18n', () => {
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

  it('all translation packages should translate all implemented functions', () => {
    const implementedFunctions = Config.getRegisteredFunctions()
    implementedFunctions.add('OFFSET') // HARDCODED FUNCTION

    for (const lang in languages) {
      const translatedFunctionsInLang = new Set(Object.keys(languages[lang].functions))
      expect(translatedFunctionsInLang).toEqual(implementedFunctions)
    }
  })

  it('translation package sanitization', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new TranslationPackage({}, {}, {})).toThrowError()
  })
})
