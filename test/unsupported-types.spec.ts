import {EmptyValue, HyperFormula} from '../src'
import {adr} from './testUtils'

describe( 'unsupported types should result in error', () => {
  it('should give parsing error', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[[ ]]])
    ).toThrow('Unable to parse value: \'\'')

    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[{}]])
    ).toThrow('Unable to parse value: \'[object Object]')

    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[() => {}]])
    ).toThrow('Unable to parse value: \'() => { }\'')

    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromSheets({Sheet1: [[ () => {}]], Sheet2: [[ () => {}]],
    })).toThrow( 'Unable to parse value: \'() => { }\'')

    const sheet = [
      [],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => engine.setCellContents(adr('A1'), ()=>{})
    ).toThrow('Unable to parse value: \'() => { }\'')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => engine.setSheetContent('Sheet1', [[ () => {} ]])
    ).toThrow('Unable to parse value: \'() => { }\'')
  })

  it('should give error when not an array', () => {
    const sheet = [
      [],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => engine.setSheetContent('Sheet1', 1)
    ).toThrow('Expected an array of arrays.')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => engine.setSheetContent('Sheet1', [1])
    ).toThrow('Expected an array of arrays.')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => engine.setCellContents(adr('A1'), [1])
    ).toThrow('Expected an array of arrays or a raw cell value.')
  })
})
