import {HyperFormula, NoSheetWithIdError, SheetNameAlreadyTakenError} from '../../src'

describe('Is it possible to rename sheet', () => {
  it('true if possible', () => {
    const [engine] = HyperFormula.buildFromSheets({'Sheet1': []})

    expect(engine.isItPossibleToRenameSheet(0, 'Foo')).toEqual(true)
    expect(engine.isItPossibleToRenameSheet(0, '~`!@#$%^&*()_-+_=/|?{}[]\"')).toEqual(true)
  })

  it('true if same name', () => {
    const [engine] = HyperFormula.buildFromSheets({'Sheet1': []})

    expect(engine.isItPossibleToRenameSheet(0, 'Sheet1')).toEqual(true)
  })

  it('false if sheet does not exists', () => {
    const [engine] = HyperFormula.buildFromSheets({'Sheet1': []})

    expect(engine.isItPossibleToRenameSheet(1, 'Foo')).toEqual(false)
  })

  it('false if given name is taken', () => {
    const [engine] = HyperFormula.buildFromSheets({'Sheet1': [], 'Sheet2': []})

    expect(engine.isItPossibleToRenameSheet(0, 'Sheet2')).toEqual(false)
  })
})

describe('Rename sheet', () => {
  it('works', () => {
    const [engine] = HyperFormula.buildEmpty()
    engine.addSheet('foo')

    engine.renameSheet(0, 'bar')

    expect(engine.getSheetName(0)).toBe('bar')
    expect(engine.doesSheetExist('foo')).toBe(false)
    expect(engine.doesSheetExist('bar')).toBe(true)
  })

  it('error when there is no sheet with given ID', () => {
    const [engine] = HyperFormula.buildEmpty()

    expect(() => {
      engine.renameSheet(0, 'bar')
    }).toThrow(new NoSheetWithIdError(0))
  })

  it('error when new sheet name is already taken', () => {
    const [engine] = HyperFormula.buildEmpty()
    engine.addSheet()
    engine.addSheet('bar')

    expect(() => {
      engine.renameSheet(0, 'bar')
    }).toThrow(new SheetNameAlreadyTakenError('bar'))
  })

  it('change for the same name', () => {
    const [engine] = HyperFormula.buildEmpty()
    engine.addSheet('foo')

    engine.renameSheet(0, 'foo')

    expect(engine.getSheetName(0)).toBe('foo')
    expect(engine.doesSheetExist('foo')).toBe(true)
  })

  it('change for the same canonical name', () => {
    const [engine] = HyperFormula.buildEmpty()
    engine.addSheet('Foo')

    engine.renameSheet(0, 'FOO')

    expect(engine.getSheetName(0)).toBe('FOO')
    expect(engine.doesSheetExist('FOO')).toBe(true)
  })
})
