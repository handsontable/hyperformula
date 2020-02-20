import {EmptyValue, HyperFormula} from '../src'
import {adr} from './testUtils'

describe( 'unsupported types should result in error', () => {
  it('should give nice error in #buildFromArray', () => {
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
  })
  it('should give nice error in #buildFromSheets', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromSheets({
      Sheet1: [[ () => {}]],
      Sheet2: [[ () => {}]],
    })).toThrow( 'Cannot parse value.')
  })
})
