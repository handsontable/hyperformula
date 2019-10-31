import {HyperFormula} from '../src'
import {Config} from '../src'
import {enGB, languages, plPL} from '../src/i18n'
import './testConfig.ts'

describe('i18n', () => {
  it('using functions in different languages', () => {
    const enginePL = HyperFormula.buildFromArray([
      ['=SUMA(42)'],
    ], new Config({language: plPL}))
    const engineEN = HyperFormula.buildFromArray([
      ['=SUM(42)'],
    ], new Config({language: enGB}))

    expect(enginePL.getCellValue('A1')).toBe(42)
    expect(engineEN.getCellValue('A1')).toBe(42)
  })

  it('using functions in different languages with not standard characters', () => {
    const enginePL = HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['2'],
      ['=LICZ.JEŻELI(A1:A3, ">=1")']
    ], new Config({language: plPL}))
    const engineEN = HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['2'],
      ['=COUNTIF(A1:A3, ">=1")'],
    ], new Config({language: enGB}))

    expect(enginePL.getCellValue('A4')).toBe(2)
    expect(engineEN.getCellValue('A4')).toBe(2)
  })

  it('all function translation keys has to be upper cased', () => {
    for (const lang in languages) {
      const translationPackage = languages[lang]
      for (const translationKey in translationPackage.functions) {
        expect(translationPackage.functions[translationKey]).toEqual(translationPackage.functions[translationKey].toUpperCase())
      }
    }
  })

  it('all translation packages should translate all enGB functions', () => {
    const translatedFunctionsIn_enGB = new Set(Object.keys(enGB.functions))

    for (const lang in languages) {
      if (lang === 'enGB') {
        continue
      }

      const translationPackage = languages[lang]
      const translatedFunctionsIn_lang = new Set(Object.keys(languages[lang].functions))
      expect(translatedFunctionsIn_lang).toEqual(translatedFunctionsIn_enGB)
    }
  })
})
