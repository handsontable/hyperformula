import {HyperFormula} from '../src'
import {adr} from './testUtils'

const BigIntSupported = (function(): boolean {
  try {
    const bigint = BigInt(1)
    return typeof bigint === 'bigint'
  } catch (e) {
    return false
  }
})()

describe( 'unsupported types should result in error', () => {
  it('should give parsing error #1', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await HyperFormula.buildFromArray([[[]]])
    ).rejects.toThrowError('Unable to parse value: []')
  })
  it('should give parsing error #2', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await HyperFormula.buildFromArray([[{}]])
    ).rejects.toThrowError('Unable to parse value: {}')
  })
  it('should give parsing error #3', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await HyperFormula.buildFromArray([[() => {}]]))
      .rejects.toThrowError(/^Unable to parse value\: "(\(\) \=\> \{ \}|function \(\) \{\})"$/)
  })
  it('should give parsing error #4', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await HyperFormula.buildFromSheets({Sheet1: [[ () => {}]], Sheet2: [[ () => {}]]}))
      .rejects.toThrowError(/^Unable to parse value\: "(\(\) \=\> \{ \}|function \(\) \{\})"$/)
  })
  it('should give parsing error #5', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await HyperFormula.buildFromArray([[Symbol()]])
    ).rejects.toThrowError('Unable to parse value: \"Symbol()\"')
  })
  it('should give parsing error #6', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await HyperFormula.buildFromArray([[/abcd/]])
    ).rejects.toThrowError('Unable to parse value: \"RegExp(/abcd/)\"')
  })
  it('should give parsing error #7', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await HyperFormula.buildFromArray([[{sym: Symbol()}]])
    ).rejects.toThrowError('Unable to parse value: {\n' +
      '    \"sym\": \"Symbol()\"\n' +
      '}')
  })
  it('should give parsing error #9', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await HyperFormula.buildFromArray([[Symbol('a')]])
    ).rejects.toThrowError('Unable to parse value: \"Symbol(a)\"')
  })
  it('should give parsing error #10', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await HyperFormula.buildFromArray([[[Symbol(/abcd/)]]])
    ).rejects.toThrowError('Unable to parse value: [\n' +
      '    \"Symbol(/abcd/)\"\n' +
      ']')
  })
  it('should give parsing error #11', () => {
    if(BigIntSupported) {
      // eslint-disable-next-line
      // @ts-ignore
      expect(async() => await HyperFormula.buildFromArray([[BigInt(9007199254740991)]])
      ).rejects.toThrowError('Unable to parse value: \"BigInt(9007199254740991)\"')
    }
  })
  it('should give parsing error for setCellContents', async() => {
    const sheet = [
      [],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await engine.setCellContents(adr('A1'), ()=>{}))
      .rejects.toThrowError(/^Unable to parse value\: "(\(\) \=\> \{ \}|function \(\) \{\})"$/)
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await engine.setSheetContent(0, [[ () => {} ]]))
    .rejects.toThrowError(/^Unable to parse value\: "(\(\) \=\> \{ \}|function \(\) \{\})"$/)
  })

  it('should give error when not an array', async() => {
    const sheet = [
      [],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await engine.setSheetContent(0, 1)
    ).rejects.toThrowError('Invalid arguments, expected an array of arrays.')
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await engine.setSheetContent(0, [1])
    ).rejects.toThrowError('Invalid arguments, expected an array of arrays.')
    // eslint-disable-next-line
    // @ts-ignore
    expect(async() => await engine.setCellContents(adr('A1'), [1]))
      .rejects.toThrowError('Invalid arguments, expected an array of arrays or a raw cell value.')
  })
})
