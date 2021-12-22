import {ExportedCellChange, HyperFormula} from '../../src'
import {adr, expectArrayWithSameContent} from '../testUtils'

describe('Replace sheet content - checking if its possible', () => {
  it('no if theres no such sheet', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToReplaceSheetContent(1, [])).toEqual(false)
  })

  it('yes otherwise', () => {
    const [engine] = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToReplaceSheetContent(0, [])).toEqual(true)
  })
})

describe('Replace sheet content', () => {
  it('should throw error trying to replace not existing sheet', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    expect(() => {
      engine.setSheetContent(1, [['3', '4']])

    }).toThrowError("There's no sheet with id = 1")
  })

  it('should replace sheet content with new values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    engine.setSheetContent(0, [['3', '4']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toBe(null)
    expect(engine.getCellValue(adr('B2'))).toBe(null)
  })

  /* for now return only new values */
  it('should return changes', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    const [changes] = engine.setSheetContent(0, [['3', '4']])

    expectArrayWithSameContent(changes, [
      new ExportedCellChange(adr('A1'), 3),
      new ExportedCellChange(adr('B1'), 4),
    ])
  })

  /* should we return removed values? */
  xit('should return new values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    const [changes] = engine.setSheetContent(0, [['3', '4']])

    expect(changes.length).toEqual(4)

    expectArrayWithSameContent(changes, [
      new ExportedCellChange(adr('A1'), 3),
      new ExportedCellChange(adr('B1'), 4),
      new ExportedCellChange(adr('A2'), null),
      new ExportedCellChange(adr('B2'), null),
    ])
  })

  it('should replace content of a sheet with formula matrix', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
      Sheet2: [
        ['=Sheet1!A2'],
        ['=Sheet1!A3'],
      ],
    })

    engine.setSheetContent(0, [
      ['3', '4'],
      ['foo', '5'],
    ])

    expect(engine.getCellValue(adr('A1', 1))).toEqual('foo')
    expect(engine.getCellValue(adr('A2', 1))).toBe(null)
  })

  it('should replace content of a sheet with formula matrix and recalculate range formula', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
      Sheet2: [
        ['=SUM(Sheet1!A1:A2)'],
      ],
    })

    engine.setSheetContent(0, [
      ['3', '4'],
      [null, '5'],
    ])

    expect(engine.getCellValue(adr('A1', 1))).toEqual(3)
  })
})
