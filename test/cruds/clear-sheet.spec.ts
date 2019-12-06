import {Config, EmptyValue, HyperFormula} from "../../src";
import {adr} from "../testUtils";
import {NoSheetWithNameError} from "../../src/HyperFormula";

describe('Clear sheet - checking if its possible', () => {
  it('no if theres no such sheet', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToClearSheet('foo')).toEqual(false)
  })

  it('yes otherwise', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToClearSheet('Sheet1')).toEqual(true)
  })
})

describe('Clear sheet content', () => {
  it('should throw error when trying to clear not existing sheet', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(() => {
      engine.clearSheet('foo')
    }).toThrow(new NoSheetWithNameError('foo'))
  })

  it('should clear sheet content', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', 'foo']
    ])

    engine.clearSheet('Sheet1')

    expect(engine.getCellValue(adr("A1"))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr("B1"))).toEqual(EmptyValue)
    expect(engine.getSheetDimensions(0)).toEqual({width: 0, height: 0})
  })

  it('should recalculate and return changes', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [
        ['1']
      ],
      'Sheet2': [
        ['=Sheet1!A1'],
        ['=SUM(1, Sheet1!A1)']
      ]
    })

    const changes = engine.clearSheet('Sheet1')

    expect(engine.getCellValue(adr('A1', 1))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('A2', 1))).toEqual(1)

    expect(changes.length).toEqual(2)
  })

  it('should clear sheet with numeric matrix', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [
        ['1', '2'],
      ],
      'Sheet2': [
        ['=Sheet1!A1'],
        ['=Sheet1!B1'],
      ]
    }, new Config({ matrixDetection: true, matrixDetectionThreshold: 1 }))

    const changes = engine.clearSheet('Sheet1')

    expect(engine.getCellValue(adr('A1', 1))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('A2', 1))).toEqual(EmptyValue)

    expect(changes.length).toEqual(2)
  })

  it('should clear sheet with formula matrix', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
      'Sheet2': [
        ['=Sheet1!A2'],
        ['=Sheet1!A3'],
      ]
    })

    const changes = engine.clearSheet('Sheet1')

    expect(engine.getCellValue(adr('A1', 1))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('A2', 1))).toEqual(EmptyValue)

    expect(changes.length).toEqual(2)
  })
})
