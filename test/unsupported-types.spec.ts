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

describe('unsupported types should result in error', () => {
  it('should give parsing error #1', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => HyperFormula.buildFromArray([[[]]])
    ).toThrowError('Unable to parse value: []')
  })
  it('should give parsing error #2', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => HyperFormula.buildFromArray([[{}]])
    ).toThrowError('Unable to parse value: {}')
  })
  it('should give parsing error #3', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => HyperFormula.buildFromArray([[() => {}]]))
      .toThrowError(/^Unable to parse value\: "(\(\) \=\> \{ \}|function \(\) \{\})"$/)
  })
  it('should give parsing error #4', () => {
    expect(() => HyperFormula.buildFromSheets({
      // eslint-disable-next-line
      // @ts-ignore
      Sheet1: [[() => {}]],
      // eslint-disable-next-line
      // @ts-ignore
      Sheet2: [[() => {}]]
    }))
      .toThrowError(/^Unable to parse value\: "(\(\) \=\> \{ \}|function \(\) \{\})"$/)
  })
  it('should give parsing error #5', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => HyperFormula.buildFromArray([[Symbol()]])
    ).toThrowError('Unable to parse value: \"Symbol()\"')
  })
  it('should give parsing error #6', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => HyperFormula.buildFromArray([[/abcd/]])
    ).toThrowError('Unable to parse value: \"RegExp(/abcd/)\"')
  })
  it('should give parsing error #7', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => HyperFormula.buildFromArray([[{sym: Symbol()}]])
    ).toThrowError('Unable to parse value: {\n' +
      '    \"sym\": \"Symbol()\"\n' +
      '}')
  })
  it('should give parsing error #9', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => HyperFormula.buildFromArray([[Symbol('a')]])
    ).toThrowError('Unable to parse value: \"Symbol(a)\"')
  })
  it('should give parsing error #10', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => HyperFormula.buildFromArray([[[Symbol(/abcd/)]]])
    ).toThrowError('Unable to parse value: [\n' +
      '    \"Symbol(/abcd/)\"\n' +
      ']')
  })
  it('should give parsing error #11', () => {
    if (BigIntSupported) {
      // eslint-disable-next-line
      // @ts-ignore
      expect(() => HyperFormula.buildFromArray([[BigInt(9007199254740991)]])
      ).toThrowError('Unable to parse value: \"BigInt(9007199254740991)\"')
    }
  })
  it('should give parsing error for setCellContents', () => {
    const sheet = [
      [],
    ]
    const [engine] = HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => engine.setCellContents(adr('A1'), () => {}))
      .toThrowError(/^Unable to parse value\: "(\(\) \=\> \{ \}|function \(\) \{\})"$/)
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => engine.setSheetContent(0, [[() => {}]]))
      .toThrowError(/^Unable to parse value\: "(\(\) \=\> \{ \}|function \(\) \{\})"$/)
  })

  it('should give error when not an array', () => {
    const sheet = [
      [],
    ]
    const [engine] = HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => engine.setSheetContent(0, 1)
    ).toThrowError('Invalid arguments, expected an array of arrays.')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => engine.setSheetContent(0, [1])
    ).toThrowError('Invalid arguments, expected an array of arrays.')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => engine.setCellContents(adr('A1'), [1]))
      .toThrowError('Invalid arguments, expected an array of arrays or a raw cell value.')
  })
})
