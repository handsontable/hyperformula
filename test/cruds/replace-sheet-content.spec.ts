import {ExportedCellChange, HyperFormula} from '../../src'
import {adr, expectArrayWithSameContent} from '../testUtils'

describe('Replace sheet content - checking if its possible', () => {
  it('no if theres no such sheet', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToReplaceSheetContent(1, [])).toEqual(false)
  })

  it('yes otherwise', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToReplaceSheetContent(0, [])).toEqual(true)
  })
})

describe('Replace sheet content', () => {
  it('should throw error trying to replace not existing sheet', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    await expect((async() => {
      await engine.setSheetContent(1, [['3', '4']])

    })()).rejects.toThrowError("There's no sheet with id = 1")
  })

  it('should replace sheet content with new values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    await engine.setSheetContent(0, [['3', '4']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('B1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toBe(null)
    expect(engine.getCellValue(adr('B2'))).toBe(null)
  })

  /* for now return only new values */
  it('should return changes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    const changes = await engine.setSheetContent(0, [['3', '4']])

    expectArrayWithSameContent(changes, [
      new ExportedCellChange(adr('A1'), 3),
      new ExportedCellChange(adr('B1'), 4),
    ])
  })

  /* should we return removed values? */
  xit('should return new values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', 'foo'],
    ])

    const changes = await engine.setSheetContent(0, [['3', '4']])

    expect(changes.length).toEqual(4)

    expectArrayWithSameContent(changes, [
      new ExportedCellChange(adr('A1'), 3),
      new ExportedCellChange(adr('B1'), 4),
      new ExportedCellChange(adr('A2'), null),
      new ExportedCellChange(adr('B2'), null),
    ])
  })

  it('should replace content of a sheet with formula matrix', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
      Sheet2: [
        ['=Sheet1!A2'],
        ['=Sheet1!A3'],
      ],
    })

    await engine.setSheetContent(0, [
      ['3', '4'],
      ['foo', '5'],
    ])

    expect(engine.getCellValue(adr('A1', 1))).toEqual('foo')
    expect(engine.getCellValue(adr('A2', 1))).toBe(null)
  })

  it('should replace content of a sheet with formula matrix and recalculate range formula', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
      Sheet2: [
        ['=SUM(Sheet1!A1:A2)'],
      ],
    })

    await engine.setSheetContent(0, [
      ['3', '4'],
      [null, '5'],
    ])

    expect(engine.getCellValue(adr('A1', 1))).toEqual(3)
  })
})
