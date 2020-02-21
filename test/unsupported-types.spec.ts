import {EmptyValue, HyperFormula} from '../src'
import {adr} from './testUtils'

describe( 'unsupported types should result in error', () => {
  it('should give parsing error', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[
      [ ]
    ]]) ).toThrow('Cannot parse value.')

    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[
      {}
    ]]) ).toThrow('Cannot parse value.')

    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[
      () => {}
    ]]) ).toThrow('Cannot parse value.')

    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromSheets({
      Sheet1: [[ () => {}]],
      Sheet2: [[ () => {}]],
    })).toThrow( 'Cannot parse value.')

    const sheet = [
      [],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => engine.setCellContents(adr('A1'), ()=>{})).toThrow('Cannot parse value.')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => engine.setSheetContent('Sheet1', [[ () => {} ]])).toThrow('Cannot parse value.')
  })

  it('should give error when not an array', () => {
    const sheet = [
      [],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line
    // @ts-ignore
    engine.setSheetContent('Sheet1', [1])
  })
})
