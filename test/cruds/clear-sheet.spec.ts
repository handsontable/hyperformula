import {HyperFormula, NoSheetWithIdError} from '../../src'
import {adr} from '../testUtils'

describe('Clear sheet - checking if its possible', () => {
  it('no if theres no such sheet', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToClearSheet(1)).toEqual(false)
  })

  it('yes otherwise', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToClearSheet(0)).toEqual(true)
  })
})

describe('Clear sheet content', () => {
  it('should throw error when trying to clear not existing sheet', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(() => {
      await engine.clearSheet(1)
    }).toThrow(new NoSheetWithIdError(1))
  })

  it('should clear sheet content', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', 'foo'],
    ])

    await engine.clearSheet(0)

    expect(engine.getCellValue(adr('A1'))).toBe(null)
    expect(engine.getCellValue(adr('B1'))).toBe(null)
  })

  it('should recalculate and return changes', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'],
      ],
      Sheet2: [
        ['=Sheet1!A1'],
        ['=SUM(1, Sheet1!A1)'],
      ],
    })

    const changes = await engine.clearSheet(0)

    expect(engine.getCellValue(adr('A1', 1))).toBe(null)
    expect(engine.getCellValue(adr('A2', 1))).toEqual(1)

    expect(changes.length).toEqual(2)
  })

  it('should clear sheet with matrix', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['=TRANSPOSE(A1:B1)'],
      ],
      Sheet2: [
        ['=Sheet1!A2'],
        ['=Sheet1!A3'],
      ],
    })

    const changes = await engine.clearSheet(0)

    expect(engine.getCellValue(adr('A1', 1))).toBe(null)
    expect(engine.getCellValue(adr('A2', 1))).toBe(null)

    expect(changes.length).toEqual(2)
  })

  it('should clear sheet and dont break edge between cells', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'],
      ],
      Sheet2: [
        ['=Sheet1!A1'],
      ],
    })

    await engine.clearSheet(0)
    await engine.setCellContents(adr('A1'), '2')

    expect(engine.getCellValue(adr('A1', 1))).toEqual(2)
  })

  it('should clear sheet and dont break edge between cells, case with range', async() => {
const engine = await HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'],
      ],
      Sheet2: [
        ['=SUM(Sheet1!A1:B1)'],
      ],
    })

    // eslint-disable-next-line
    const changes = await engine.clearSheet(0)

    await engine.setCellContents(adr('A1'), '2')
    await engine.setCellContents(adr('B1'), '3')

    expect(engine.getCellValue(adr('A1', 1))).toEqual(5)
  })
})
