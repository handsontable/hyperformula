import {HyperFormula, Config} from '../src'
import {CellError, EmptyValue, ErrorType} from '../src/Cell'
import './testConfig.ts'
import {adr, expect_reference_to_have_ref_error} from './testUtils'

describe('Integration', () => {
  it('#loadSheet load simple sheet', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('#loadSheet load simple sheet', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    expect(engine.getCellValue(adr('C2'))).toBe(6)
  })

  it('#loadSheet evaluate empty vertex', () => {
    const engine = HyperFormula.buildFromArray([['=A5']])

    expect(engine.getCellValue(adr('A5'))).toBe(EmptyValue)
    expect(engine.getCellValue(adr('A1'))).toBe(EmptyValue)
  })

  it('#loadSheet evaluate empty vertex', () => {
    const engine = HyperFormula.buildFromArray([['', '=A1']])

    expect(engine.getCellValue(adr('B1'))).toBe(EmptyValue)
  })

  it('handle different input types', () => {
    const engine = HyperFormula.buildFromArray([['', null, undefined]])

    expect(engine.getCellValue(adr('A1'))).toBe(EmptyValue)
    expect(engine.getCellValue(adr('B1'))).toBe(EmptyValue)
    expect(engine.getCellValue(adr('C1'))).toBe(EmptyValue)
  })

  it('loadSheet with a loop', () => {
    const engine = HyperFormula.buildFromArray([['=B1', '=C1', '=A1']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside plus operator', () => {
    const engine = HyperFormula.buildFromArray([['5', '=A1+B1']])
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside minus operator', () => {
    const engine = HyperFormula.buildFromArray([['5', '=A1-B1']])
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.CYCLE))
  })

  it('loadSheet with operator precedence', () => {
    const engine = HyperFormula.buildFromArray([['=3*7*2-4*1+2']])
    expect(engine.getCellValue(adr('A1'))).toBe(40)
  })

  it('loadSheet with operator precedence and brackets', () => {
    const engine = HyperFormula.buildFromArray([['=3*7+((2-4)*(1+2)+3)*2']])
    expect(engine.getCellValue(adr('A1'))).toBe(15)
  })

  it('loadSheet with operator precedence with cells', () => {
    const engine = HyperFormula.buildFromArray([['3', '4', '=B1*2+A1']])
    expect(engine.getCellValue(adr('C1'))).toBe(11)
  })

  it('#loadSheet - it should build graph without cycle but with formula with error', () => {
    const engine = HyperFormula.buildFromArray([['=A1B1']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NAME))
  })

  it('#loadSheet - dependency before value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=B1', '1', '2'],
      ['=SUM(B2:C2)', '1', '2'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(3)
  })

  it('should be possible to build graph with reference to not existing sheet', () => {
    const engine = HyperFormula.buildFromArray([['=$Sheet2.A2']])

    expect_reference_to_have_ref_error(engine, adr('A1'))
  })

  it('#getCellFormula returns formula when present', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(1,2,3,C3)']
    ])

    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(1,2,3,C3)')
  })

  it('#getCellFormula returns undefined for simple values', () => {
    const engine = HyperFormula.buildFromArray([
      [''],
      ['42'],
      ['foobar'],
    ])

    expect(engine.getCellFormula(adr('A1'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A2'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A3'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A4'))).toEqual(undefined)
  })

  it('#getCellFormula returns matrix formula for matrix vertices', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
      ['{=MMULT(A1:B2,A1:B2)}', '{=MMULT(A1:B2,A1:B2)}'],
      ['{=MMULT(A1:B2,A1:B2)}', '{=MMULT(A1:B2,A1:B2)}'],
    ])

    expect(engine.getCellFormula(adr('A3'))).toEqual('{=MMULT(A1:B2,A1:B2)}')
    expect(engine.getCellFormula(adr('A4'))).toEqual('{=MMULT(A1:B2,A1:B2)}')
    expect(engine.getCellFormula(adr('B3'))).toEqual('{=MMULT(A1:B2,A1:B2)}')
    expect(engine.getCellFormula(adr('B4'))).toEqual('{=MMULT(A1:B2,A1:B2)}')
  })

  it('#getCellFormula returns undefined for numeric matrices', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
    ], new Config({ matrixDetection: true, matrixDetectionThreshold: 1 }))

    expect(engine.getCellFormula(adr('A1'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A2'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('B1'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('B2'))).toEqual(undefined)
  })

  it('#sheetName if sheet exists', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet()

    expect(engine.sheetName(0)).toEqual('Sheet1')
  })

  it('#sheetName if sheet doesnt exists', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.sheetName(0)).toBeUndefined()
  })

  it('#sheetId if sheet exists', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet('foobar')

    expect(engine.sheetId('foobar')).toEqual(0)
  })

  it('#sheetId if sheet doesnt exists', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.sheetId('doesntexist')).toBeUndefined()
  })

  it('#doesSheetExist if sheet exists', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet('foobar')

    expect(engine.doesSheetExist('foobar')).toBe(true)
  })

  it('#doesSheetExist if sheet doesnt exist', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.doesSheetExist('foobar')).toBe(false)
  })

  it('#numberOfSheets for zero', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.numberOfSheets()).toBe(0)
  })

  it('#numberOfSheets', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet('foo')

    expect(engine.numberOfSheets()).toBe(1)
  })
})
