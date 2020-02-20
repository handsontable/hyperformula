import {Config, EmptyValue, HyperFormula} from '../../src'
import {adr, expectArrayWithSameContent} from '../testUtils'

describe('Replace sheet content - checking if its possible', () => {
  it('no if theres no such sheet', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToReplaceSheetContent('foo')).toEqual(false)
  })

  it('yes otherwise', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToReplaceSheetContent('Sheet1')).toEqual(true)
  })
})

describe('Replace sheet content', () => {
  it('should throw error trying to replace not existing sheet', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    expect(() => {
      engine.setSheetContent('Sheet2', [['3', '4']])

    }).toThrowError("There's no sheet with name 'Sheet2'")
  })

  it('should replace sheet content with new values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    engine.setSheetContent('Sheet1', [['3', '4']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('B2'))).toEqual(EmptyValue)
  })

  /* for now return only new values */
  it('should return changes', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    const changes = engine.setSheetContent('Sheet1', [['3', '4']])

    expectArrayWithSameContent(changes, [
      { sheet: 0, col: 0, row: 0, value: 3 },
      { sheet: 0, col: 1, row: 0, value: 4 },
    ])
  })

  /* should we return removed values? */
  xit('should return new values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    const changes = engine.setSheetContent('Sheet1', [['3', '4']])

    expect(changes.length).toEqual(4)

    expectArrayWithSameContent(changes, [
      { sheet: 0, col: 0, row: 0, value: 3 },
      { sheet: 0, col: 1, row: 0, value: 4 },
      { sheet: 0, col: 0, row: 1, value: EmptyValue },
      { sheet: 0, col: 1, row: 1, value: EmptyValue },
    ])
  })

  it('should replace content of a sheet with numeric matrix', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
      ],
      Sheet2: [
        ['=Sheet1!A1'],
        ['=Sheet1!B1'],
      ],
    }, new Config({ matrixDetection: true, matrixDetectionThreshold: 1 }))

    engine.setSheetContent('Sheet1', [['3']])

    expect(engine.getCellValue(adr('A1', 1))).toEqual(3)
    expect(engine.getCellValue(adr('A2', 1))).toEqual(EmptyValue)
  })

  it('should replace content of a sheet with formula matrix', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
      Sheet2: [
        ['=Sheet1!A2'],
        ['=Sheet1!A3'],
      ],
    })

    engine.setSheetContent('Sheet1', [
      ['3', '4'],
      ['foo', '5'],
    ])

    expect(engine.getCellValue(adr('A1', 1))).toEqual('foo')
    expect(engine.getCellValue(adr('A2', 1))).toEqual(EmptyValue)
  })

  it('should replace content of a sheet with formula matrix and recalculate range formula', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
      Sheet2: [
        ['=SUM(Sheet1!A1:A2)'],
      ],
    })

    engine.setSheetContent('Sheet1', [
      ['3', '4'],
      [null, '5'],
    ])

    expect(engine.getCellValue(adr('A1', 1))).toEqual(3)
  })
})
