import {HandsOnEngine} from '../src'
import {Config} from '../src/Config'
import {enGB, plPL, languages} from '../src/i18n'
import './testConfig.ts'

describe('i18n', () => {
  it('using functions in different languages', () => {
    const enginePL = HandsOnEngine.buildFromArray([
      ['=SUMA(42)'],
    ], new Config({language: plPL}))
    const engineEN = HandsOnEngine.buildFromArray([
      ['=SUM(42)'],
    ], new Config({language: enGB}))

    expect(enginePL.getCellValue('A1')).toBe(42)
    expect(engineEN.getCellValue('A1')).toBe(42)
  })

  it('all function translation keys has to be upper cased', () => {
    for (const lang in languages) {
      const translationPackage = languages[lang]
      for (const translationKey in translationPackage.functions) {
        expect(translationPackage.functions[translationKey]).toEqual(translationPackage.functions[translationKey].toUpperCase())
      }
    }
  })
})
