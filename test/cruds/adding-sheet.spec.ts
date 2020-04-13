import {EmptyValue, HyperFormula} from '../../src'
import '../testConfig'
import {plPL} from '../../src/i18n'
import {adr} from '../testUtils'

describe('Adding sheet - checking if its possible', () => {
  it('yes', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.isItPossibleToAddSheet('Sheet1')).toEqual(true)
  })

  it('no', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Foo: [],
    })

    expect(engine.isItPossibleToAddSheet('Sheet1')).toEqual(false)
    expect(engine.isItPossibleToAddSheet('Foo')).toEqual(false)
  })
})

describe('add sheet to engine', () => {
  it('should add sheet to empty engine', function() {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet()

    expect(engine.sheetMapping.numberOfSheets()).toEqual(1)
    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1'])
  })

  it('should add sheet to engine with one sheet', function() {
    const engine = HyperFormula.buildFromArray([
      ['foo'],
    ])

    engine.addSheet()

    expect(engine.sheetMapping.numberOfSheets()).toEqual(2)
    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Sheet1', 'Sheet2'])
  })

  it('should be possible to fetch empty cell from newly added sheet', function() {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet()

    expect(engine.getCellValue(adr('A1', 0))).toBe(EmptyValue)
  })

  it('should add sheet with translated sheet name', function() {
    HyperFormula.registerLanguage('plPL', plPL)
    const engine = HyperFormula.buildEmpty({ language: 'plPL' })

    engine.addSheet()

    expect(engine.sheetMapping.numberOfSheets()).toEqual(1)
    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['Arkusz1'])
  })

  it('should add sheet with given name', function() {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet('foo')

    expect(engine.sheetMapping.numberOfSheets()).toEqual(1)
    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['foo'])
  })

  it('cannot add another sheet with same lowercased name', function() {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('foo')

    expect(() => {
      engine.addSheet('FOO')
    }).toThrowError(/already exists/)
    expect(engine.sheetMapping.numberOfSheets()).toEqual(1)
    expect(Array.from(engine.sheetMapping.displayNames())).toEqual(['foo'])
  })

  it('should return given name', function() {
    const engine = HyperFormula.buildEmpty()

    const sheetName = engine.addSheet('foo')

    expect(sheetName).toEqual('foo')

  })

  it('should return autogenerated name', function() {
    const engine = HyperFormula.buildEmpty()

    const sheetName = engine.addSheet()

    expect(sheetName).toEqual('Sheet1')
  })
})
