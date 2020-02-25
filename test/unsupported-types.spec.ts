import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe( 'unsupported types should result in error', () => {
  it('should give parsing error #1', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => HyperFormula.buildFromArray([[[]]])
    ).toThrow('Unable to parse value: []')
  })
  it('should give parsing error #2', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[{}]])
    ).toThrow('Unable to parse value: {}')
  })
  it('should give parsing error #3', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[() => {}]])
    ).toThrow('Unable to parse value: \"() => { }\"')
  })
  it('should give parsing error #4', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromSheets({Sheet1: [[ () => {}]], Sheet2: [[ () => {}]],
    })).toThrow( 'Unable to parse value: \"() => { }\"')
  })
  it('should give parsing error #5', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[Symbol()]])
    ).toThrow('Unable to parse value: \"Symbol()\"')
  })
  it('should give parsing error #6', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[/abcd/]])
    ).toThrow('Unable to parse value: \"/abcd/\"')
  })
  it('should give parsing error #7', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[{sym: Symbol()}]])
    ).toThrow('Unable to parse value: {\n' +
      '    \"sym\": \"Symbol()\"\n' +
      '}')
  })
  it('should give parsing error #8', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[Symbol(Symbol())]])
    ).toThrow('Cannot convert a Symbol value to a string')
  })
  it('should give parsing error #9', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[Symbol('a')]])
    ).toThrow('Unable to parse value: \"Symbol(a)\"')
  })
  it('should give parsing error #10', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[[Symbol(/abcd/)]]])
    ).toThrow('Unable to parse value: [\n' +
      '    \"Symbol(/abcd/)\"\n' +
      ']')
  })
  it('should give parsing error #11', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => HyperFormula.buildFromArray([[BigInt(9007199254740991)]])
    ).toThrow('Unable to parse value: \"9007199254740991\"')
  })
  it('should give parsing error for setCellContents', () => {
    const sheet = [
      [],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => engine.setCellContents(adr('A1'), ()=>{})
    ).toThrow('Unable to parse value: \"() => { }\"')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => engine.setSheetContent('Sheet1', [[ () => {} ]])
    ).toThrow('Unable to parse value: \"() => { }\"')
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
