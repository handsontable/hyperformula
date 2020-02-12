import {HyperFormula} from '../src'
import {simpleCellAddress} from '../src/Cell'
import './testConfig'
import {adr} from './testUtils'

describe("Named expressions", () => {
  it('basic usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    expect(engine.getNamedExpressionValue('myName')).toEqual(52)
  })

  it('is recomputed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    engine.setCellContent(adr('A1'), '20')

    expect(engine.getNamedExpressionValue('myName')).toEqual(30)
  })

  it('works for more formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    engine.addNamedExpression('myName1', '=Sheet1!A1+10')
    engine.addNamedExpression('myName2', '=Sheet1!A1+11')

    expect(engine.getNamedExpressionValue('myName1')).toEqual(52)
    expect(engine.getNamedExpressionValue('myName2')).toEqual(53)
  })

  it('adding the same named expression twice is forbidden', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('myName', '=Sheet1!A1+10')

    expect(() => {
      engine.addNamedExpression('myName', '=Sheet1!A1+10')
    }).toThrowError(`Named expression 'myName' is already present in the workbook`)
  })

  xit('is possible to change named expression formula to other', () => {
    // const engine = HyperFormula.buildFromArray([
    //   ['42'],
    // ])
    // engine.addNamedExpression('myName', '=Sheet1!A1+10')

    // engine.setCellContent(namedExpressionAddress, '=Sheet1!A1+11')

    // expect(engine.getNamedExpressionValue('myName')).toEqual(53)
  })
})
