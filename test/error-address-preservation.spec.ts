import {ErrorType, HyperFormula} from '../src'
import {adr, detailedErrorWithOrigin} from './testUtils'
import {EmptyValue} from '../src/interpreter/InterpreterValue'
import {simpleCellRange} from '../src/AbsoluteCellRange'

describe('Address preservation.', () => {
  it('Should work in the basic case.', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=NA()', '=A1']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
  })

  it('Should work with named expressions.', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=NAMEDEXPRESSION', '=A1']
    ])
    await engine.addNamedExpression('NAMEDEXPRESSION', '=NA()')
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'NAMEDEXPRESSION'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'NAMEDEXPRESSION'))
  })

  it('Should work with operators.', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=NA()', '=NA()', '=A1+B1']
    ])
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
  })

  it('Should work between sheets.', async() => {
const engine = await HyperFormula.buildFromSheets({
      sheet1: [['=NA()']],
      sheet2: [['=sheet1!A1']]
    })
    expect(engine.getCellValue(adr('A1', 0))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'sheet1!A1'))
    expect(engine.getCellValue(adr('A1', 1))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'sheet1!A1'))
  })

  it('Should work with function calls.', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=NA()', '=DATE(1,1,A1)']
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A1'))
  })

  it('Should work with CYCLE.', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=B1', '=A1'],
      ['=A1', '=B1'],
      ['=A1', '=B1']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A1'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!B1'))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A1'))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!B1'))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A1'))
    expect(engine.getCellValue(adr('B3'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!B1'))
  })

  it('Should work with CYCLE #2.', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=B1', '=A1'],
      ['=A1'],
      ['=A1']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A1'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!B1'))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A1'))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedErrorWithOrigin(ErrorType.CYCLE, 'Sheet1!A1'))
  })

  it('Should work after simple cruds', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=NA()', '=A1']
    ])

    engine.addColumns(0, [0, 1])
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!B1'))

    await engine.setCellContents(adr('B1'), '=1/0')
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedErrorWithOrigin(ErrorType.DIV_BY_ZERO, 'Sheet1!B1'))

    engine.moveCells(simpleCellRange(adr('B1'), adr('B1')), adr('C5'))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedErrorWithOrigin(ErrorType.DIV_BY_ZERO, 'Sheet1!C5'))
  })
})
