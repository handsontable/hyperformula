import {ExportedCellChange, HyperFormula, NoSheetWithIdError, CellValueType} from '../../../src'
import {AbsoluteCellRange} from '../../../src/AbsoluteCellRange'
import {ErrorType} from '../../../src/Cell'
import {ArrayFormulaVertex} from '../../../src/DependencyGraph'
import { ErrorMessage } from '../../../src/error-message'
import {ColumnIndex} from '../../../src/Lookup/ColumnIndex'
import {CellAddress} from '../../../src/parser'
import {
  adr,
  detailedError,
  detailedErrorWithOrigin,
  expectArrayWithSameContent,
  extractReference,
} from '../testUtils'

describe('Removing sheet - checking if its possible', () => {
  it('no if theres no such sheet', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveSheet(1)).toBe(false)
  })

  it('yes otherwise', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToRemoveSheet(0)).toBe(true)
  })
})

describe('remove sheet', () => {
  it('should throw error when trying to remove not existing sheet', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(() => {
      engine.removeSheet(1)
    }).toThrow(new NoSheetWithIdError(1))
  })

  it('should remove sheet by id', () => {
    const engine = HyperFormula.buildFromArray([['foo']])

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove empty sheet', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove sheet with matrix', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1'],
        ['{=TRANSPOSE(A1:A1)}'],
      ],
    })

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove sheet with formula matrix', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
        ['{=TRANSPOSE(A1:B1)}'],
      ],
    })

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should remove a sheet with a cell reference to a value in the same sheet', () => {
    const engine = HyperFormula.buildFromArray([
      [1, '=A1'],
    ])

    engine.removeSheet(0)

    expect(engine.sheetMapping.numberOfSheets()).toBe(0)
    expect(Array.from(engine.addressMapping.entries())).toEqual([])
  })

  it('should not affect data in the sheets that were referenced by the sheet being removed', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1)'],
        ['=SUM(Sheet2!A1:A2)'],
      ],
      Sheet2: [
        [1],
        [2],
        [3],
      ],
    })

    engine.removeSheet(0)

    expect(Array.from(engine.sheetMapping.iterateSheetNames())).toEqual(['Sheet2'])
    expect(engine.getCellValue(adr('A1', 1))).toBe(1)
    expect(engine.getCellValue(adr('A2', 1))).toBe(2)
    expect(engine.getCellValue(adr('A3', 1))).toBe(3)
  })

  it('converts sheet to placeholder if other sheet depends on it', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [[42]],
      Sheet2: [['=Sheet1!A1']],
    })

    const sheet1Id = engine.getSheetId('Sheet1')!

    engine.removeSheet(sheet1Id)

    expect(engine.sheetMapping.hasSheetWithId(sheet1Id, { includePlaceholders: false })).toBe(false)
    expect(engine.sheetMapping.hasSheetWithId(sheet1Id, { includePlaceholders: true })).toBe(true)
  })

  it('removes sheet completely if nothing depends on it', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [[42]],
      Sheet2: [[100]],
    })

    const sheet1Id = engine.getSheetId('Sheet1')!

    engine.removeSheet(sheet1Id)

    expect(engine.sheetMapping.hasSheetWithId(sheet1Id, { includePlaceholders: false })).toBe(false)
    expect(engine.sheetMapping.hasSheetWithId(sheet1Id, { includePlaceholders: true })).toBe(false)
  })

  it('removes the placeholder sheet if nothing depends on it any longer', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [[42]],
      Sheet2: [['=Sheet1!A1']],
    })

    const sheet1Id = engine.getSheetId('Sheet1')!
    const sheet2Id = engine.getSheetId('Sheet2')!

    engine.removeSheet(sheet1Id)

    expect(engine.sheetMapping.hasSheetWithId(sheet1Id, { includePlaceholders: false })).toBe(false)
    expect(engine.sheetMapping.hasSheetWithId(sheet1Id, { includePlaceholders: true })).toBe(true)

    engine.setCellContents(adr('A1', sheet2Id), 100)

    expect(engine.sheetMapping.hasSheetWithId(sheet1Id, { includePlaceholders: false })).toBe(false)
    expect(engine.sheetMapping.hasSheetWithId(sheet1Id, { includePlaceholders: true })).toBe(false)
  })

  it('decreases lastSheetId if removed sheet was the last one', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [[1]],
      Sheet2: [[2]],
    })

    const sheet2Id = engine.getSheetId('Sheet2')!

    engine.removeSheet(sheet2Id)

    engine.addSheet('Sheet3')
    const sheet3Id = engine.getSheetId('Sheet3')!

    expect(sheet3Id).toBe(sheet2Id) // new sheet reuses the ID
  })
})

describe('remove sheet - adjust edges', () => {
  it('should not affect dependencies to sheet other than removed', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '=A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeSheet(1)

    const a1 = engine.addressMapping.getCell(adr('A1'))
    const b1 = engine.addressMapping.getCell(adr('B1'))

    expect(engine.graph.existsEdge(a1!, b1!)).toBe(true)
  })

  it('should remove edge between sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    const a1From0 = engine.addressMapping.getCell(adr('A1'))
    const a1From1 = engine.addressMapping.getCell(adr('A1', 1))

    expect(engine.graph.existsEdge(a1From1!, a1From0!)).toBe(true)

    engine.removeSheet(1)

    expect(engine.graph.existsEdge(a1From1!, a1From0!)).toBe(false)
  })
})

describe('remove sheet - adjust formula dependencies', () => {
  it('should not affect formula with dependency to sheet other than removed', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '=A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    engine.removeSheet(1)

    const reference = extractReference(engine, adr('B1'))

    expect(reference).toEqual(CellAddress.relative(-1, 0))
    expect(engine.getAllSheetsSerialized()).toEqual({Sheet1: [['1', '=A1']]})
    expect(engine.getAllSheetsValues()).toEqual({Sheet1: [[1, 1]]})
  })

  it('should be #REF after removing sheet', () => {
    const sheet1Name = 'Sheet1'
    const sheet2Name = 'Sheet2'
    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [
        ['=Sheet2!A1'],
        ['=Sheet2!A1:A2'],
        ['=Sheet2!A:B'],
        ['=Sheet2!1:2'],
      ],
      [sheet2Name]: [
        ['1'],
      ],
    })

    const sheet1Id = engine.getSheetId(sheet1Name)!
    const sheet2Id = engine.getSheetId(sheet2Name)!

    engine.removeSheet(sheet2Id)

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A2', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A3', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A4', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should return changed values', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=Sheet2!A1'],
      ],
      Sheet2: [
        ['1'],
      ],
    })

    const changes = engine.removeSheet(1)

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A1'), detailedErrorWithOrigin(ErrorType.REF, 'Sheet1!A1', ErrorMessage.SheetRef)))
  })

})

describe('removeSheet() recalculates formulas (issue #1116)', () => {
  it('returns REF error if other sheet depends on the removed one', () => {
    const table1Name = 'table1'
    const table2Name = 'table2'
    const engine = HyperFormula.buildFromSheets({
      [table1Name]: [[`='${table2Name}'!A1`]],
      [table2Name]: [[10]],
    })

    expect(engine.getCellValue(adr('A1', engine.getSheetId(table1Name)))).toBe(10)
    expect(engine.getCellValue(adr('A1', engine.getSheetId(table2Name)))).toBe(10)

    engine.removeSheet(engine.getSheetId(table2Name)!)

    expect(engine.getCellValue(adr('A1', engine.getSheetId(table1Name)))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A1', engine.getSheetId(table2Name)))).toEqualError(detailedError(ErrorType.REF))
  })

  it('returns REF error for chained dependencies across multiple sheets', () => {
    const sheet1Name = 'Sheet1'
    const sheet2Name = 'Sheet2'
    const sheet3Name = 'Sheet3'
    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [[`='${sheet2Name}'!A1+2`]],
      [sheet2Name]: [[`='${sheet3Name}'!A1*2`]],
      [sheet3Name]: [[42]],
    })

    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet2Name)))).toBe(84)
    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toBe(86)

    engine.removeSheet(engine.getSheetId(sheet3Name)!)

    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet2Name)))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
  })

  it('returns REF error for nested dependencies within same sheet referencing removed sheet', () => {
    const sheet1Name = 'Sheet1'
    const removedSheetName = 'RemovedSheet'
    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [['=B1*2', `='${removedSheetName}'!A1`]],
      [removedSheetName]: [[15]],
    })

    expect(engine.getCellValue(adr('B1', engine.getSheetId(sheet1Name)))).toBe(15)
    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toBe(30)

    engine.removeSheet(engine.getSheetId(removedSheetName)!)

    expect(engine.getCellValue(adr('B1', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
  })

  it('returns REF error for multiple cells from different sheets referencing removed sheet', () => {
    const sheet1Name = 'Sheet1'
    const sheet2Name = 'Sheet2'
    const targetSheetName = 'TargetSheet'
    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [[`='${targetSheetName}'!A1`, `='${targetSheetName}'!B1`]],
      [sheet2Name]: [[`='${targetSheetName}'!A1+10`, `='${targetSheetName}'!B1+20`]],
      [targetSheetName]: [[5, 7]],
    })

    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toBe(5)
    expect(engine.getCellValue(adr('B1', engine.getSheetId(sheet1Name)))).toBe(7)
    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet2Name)))).toBe(15)
    expect(engine.getCellValue(adr('B1', engine.getSheetId(sheet2Name)))).toBe(27)

    engine.removeSheet(engine.getSheetId(targetSheetName)!)

    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('B1', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet2Name)))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('B1', engine.getSheetId(sheet2Name)))).toEqualError(detailedError(ErrorType.REF))
  })

  it('returns REF error for formulas with mixed operations combining removed sheet references', () => {
    const sheet1Name = 'Sheet1'
    const removedSheetName = 'RemovedSheet'
    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [[100, `='${removedSheetName}'!A1 + A1`, `='${removedSheetName}'!B1 * 2`]],
      [removedSheetName]: [[50, 25]],
    })

    expect(engine.getCellValue(adr('B1', engine.getSheetId(sheet1Name)))).toBe(150)
    expect(engine.getCellValue(adr('C1', engine.getSheetId(sheet1Name)))).toBe(50)

    engine.removeSheet(engine.getSheetId(removedSheetName)!)

    expect(engine.getCellValue(adr('B1', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('C1', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
  })

  it('returns REF error for formulas with multi-cell ranges from removed sheet', () => {
    const sheet1Name = 'Sheet1'
    const dataSheetName = 'DataSheet'
    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [
        [`=SUM('${dataSheetName}'!A1:B5)`],
        [`=MEDIAN('${dataSheetName}'!A1:B5)`],
      ],
      [dataSheetName]: [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
        [9, 10],
      ],
    })

    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toBe(55)
    expect(engine.getCellValue(adr('A2', engine.getSheetId(sheet1Name)))).toBe(5.5)

    engine.removeSheet(engine.getSheetId(dataSheetName)!)

    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A2', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
  })

  it('returns REF error for named expressions referencing removed sheet', () => {
    const sheet1Name = 'Sheet1'
    const removedSheetName = 'RemovedSheet'
    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [['=MyValue'], ['=MyValue*2']],
      [removedSheetName]: [[99]]
    }, {}, [
      { name: 'MyValue', expression: `='${removedSheetName}'!$A$1` }
    ])

    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toBe(99)
    expect(engine.getCellValue(adr('A2', engine.getSheetId(sheet1Name)))).toBe(198)

    engine.removeSheet(engine.getSheetId(removedSheetName)!)

    expect(engine.getCellValue(adr('A1', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A2', engine.getSheetId(sheet1Name)))).toEqualError(detailedError(ErrorType.REF))
  })

  it('handles add-remove-add cycle correctly', () => {
    const engine = HyperFormula.buildEmpty()
    const sheet1Name = 'Sheet1'
    const sheet2Name = 'Sheet2'

    engine.addSheet(sheet1Name)
    const sheet1Id = engine.getSheetId(sheet1Name)!
    engine.setCellContents(adr('A1', sheet1Id), `='${sheet2Name}'!A1`)

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

    engine.addSheet(sheet2Name)
    const oldSheet2Id = engine.getSheetId(sheet2Name)!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBeNull()

    engine.setCellContents(adr('A1', oldSheet2Id), 42)

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getCellValue(adr('A1', oldSheet2Id))).toBe(42)

    engine.removeSheet(oldSheet2Id)

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A1', oldSheet2Id))).toEqualError(detailedError(ErrorType.REF))

    engine.addSheet(sheet2Name)
    let newSheet2Id = engine.getSheetId(sheet2Name)!
    engine.setCellContents(adr('A1', newSheet2Id), 43)

    expect(newSheet2Id).toBe(oldSheet2Id)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(43)
    expect(engine.getCellValue(adr('A1', newSheet2Id))).toBe(43)

    engine.removeSheet(oldSheet2Id)

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A1', oldSheet2Id))).toEqualError(detailedError(ErrorType.REF))

    engine.addSheet(sheet2Name)
    newSheet2Id = engine.getSheetId(sheet2Name)!
    engine.setCellContents(adr('A1', newSheet2Id), 44)

    expect(newSheet2Id).toBe(oldSheet2Id)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(44)
    expect(engine.getCellValue(adr('A1', newSheet2Id))).toBe(44)

    engine.removeSheet(oldSheet2Id)

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A1', oldSheet2Id))).toEqualError(detailedError(ErrorType.REF))

    engine.addSheet(sheet2Name)
    newSheet2Id = engine.getSheetId(sheet2Name)!
    engine.setCellContents(adr('A1', newSheet2Id), 45)

    expect(newSheet2Id).toBe(oldSheet2Id)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(45)
    expect(engine.getCellValue(adr('A1', newSheet2Id))).toBe(45)
  })

  it('REF error propagates through dependency chain when source sheet is removed', () => {
    const engine = HyperFormula.buildFromSheets({
      'Main': [['=Intermediate!A1*2']],
      'Intermediate': [['=Source!A1+10']],
      'Source': [[5]],
    })
    const mainId = engine.getSheetId('Main')!
    const intermediateId = engine.getSheetId('Intermediate')!
    const sourceId = engine.getSheetId('Source')!

    expect(engine.getCellValue(adr('A1', mainId))).toBe(30)
    expect(engine.getCellValue(adr('A1', intermediateId))).toBe(15)

    // Remove source sheet - error should propagate through chain
    engine.removeSheet(sourceId)

    expect(engine.getCellValue(adr('A1', intermediateId))).toEqualError(detailedError(ErrorType.REF))
    expect(engine.getCellValue(adr('A1', mainId))).toEqualError(detailedError(ErrorType.REF))

    // Re-add the sheet to resolve the errors
    engine.addSheet('Source')
    engine.setCellContents(adr('A1', engine.getSheetId('Source')), 5)

    expect(engine.getCellValue(adr('A1', intermediateId))).toBe(15)
    expect(engine.getCellValue(adr('A1', mainId))).toBe(30)
  })

  it('removing sheet creates REF and adding it back resolves it', () => {
    const engine = HyperFormula.buildFromSheets({
      'Main': [['=Data!A1']],
      'Data': [[42]],
    })
    const mainId = engine.getSheetId('Main')!
    const dataId = engine.getSheetId('Data')!

    expect(engine.getCellValue(adr('A1', mainId))).toBe(42)

    engine.removeSheet(dataId)

    expect(engine.getCellValue(adr('A1', mainId))).toEqualError(detailedError(ErrorType.REF))

    engine.addSheet('Data')
    engine.setCellContents(adr('A1', engine.getSheetId('Data')), 99)

    expect(engine.getCellValue(adr('A1', mainId))).toBe(99)
  })

  describe('when using ranges with', () => {
    it('function using `runFunction`', () => {
      const sheet1Name = 'FirstSheet'
      const sheet2Name = 'NewSheet'
      const sheet1Data = [['=MEDIAN(NewSheet!A1:A1)', '=MEDIAN(NewSheet!A1:A2)', '=MEDIAN(NewSheet!A1:A3)', '=MEDIAN(NewSheet!A1:A4)']]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [sheet2Name]: sheet2Data,
      })

      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(sheet2Name)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(1.5)
      expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(2)
      expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(2.5)

      engine.removeSheet(sheet2Id)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    })

    it('function not using `runFunction`', () => {
      const sheet1Name = 'FirstSheet'
      const sheet2Name = 'NewSheet'
      const sheet1Data = [['=SUM(NewSheet!A1:A1)', '=SUM(NewSheet!A1:A2)', '=SUM(NewSheet!A1:A3)', '=SUM(NewSheet!A1:A4)']]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [sheet2Name]: sheet2Data,
      })

      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(sheet2Name)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(3)
      expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(6)
      expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(10)

      engine.removeSheet(sheet2Id)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    })

    it('function using `runFunction` referencing range indirectly', () => {
      const sheet1Name = 'FirstSheet'
      const sheet2Name = 'NewSheet'
      const sheet1Data = [
        ['=MEDIAN(A2)', '=MEDIAN(B2)', '=MEDIAN(C2)', '=MEDIAN(D2)'],
        [`='${sheet2Name}'!A1:A1`, `='${sheet2Name}'!A1:B2`, `='${sheet2Name}'!A1:A3`, `='${sheet2Name}'!A1:A4`],
      ]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [sheet2Name]: sheet2Data,
      })

      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(sheet2Name)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(1.5)
      expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(2)
      expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(2.5)

      engine.removeSheet(sheet2Id)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    })

    it('function not using `runFunction` referencing range indirectly', () => {
      const sheet1Name = 'FirstSheet'
      const sheet2Name = 'NewSheet'
      const sheet1Data = [
        ['=SUM(A2)', '=SUM(B2)', '=SUM(C2)', '=SUM(D2)'],
        [`='${sheet2Name}'!A1:A1`, `='${sheet2Name}'!A1:B2`, `='${sheet2Name}'!A1:A3`, `='${sheet2Name}'!A1:A4`],
      ]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [sheet2Name]: sheet2Data,
      })

      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(sheet2Name)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(3)
      expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(6)
      expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(10)

      engine.removeSheet(sheet2Id)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    })

    it('function calling a named expression', () => {
      const sheet1Name = 'FirstSheet'
      const sheet2Name = 'NewSheet'
      const sheet1Data = [[`='${sheet2Name}'!A1:A4`]]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [sheet2Name]: sheet2Data,
      }, {}, [
        { name: 'ExprA', expression: `=MEDIAN(${sheet2Name}!$A$1:$A$1)` },
        { name: 'ExprB', expression: `=MEDIAN(${sheet2Name}!$A$1:$A$2)` },
        { name: 'ExprC', expression: `=MEDIAN(${sheet2Name}!$A$1:$A$3)` },
        { name: 'ExprD', expression: `=MEDIAN(${sheet1Name}!$A$1)` }
      ])

      const sheet2Id = engine.getSheetId(sheet2Name)!

      expect(engine.getNamedExpressionValue('ExprA')).toBe(1)
      expect(engine.getNamedExpressionValue('ExprB')).toBe(1.5)
      expect(engine.getNamedExpressionValue('ExprC')).toBe(2)
      expect(engine.getNamedExpressionValue('ExprD')).toBe(2.5)

      engine.removeSheet(sheet2Id)

      expect(engine.getNamedExpressionValue('ExprA')).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getNamedExpressionValue('ExprB')).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getNamedExpressionValue('ExprC')).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getNamedExpressionValue('ExprD')).toEqualError(detailedError(ErrorType.REF))
    })
  })
})

describe('remove sheet - adjust address mapping', () => {
  it('should remove sheet from address mapping if nothing depends on it', () => {
    const sheet1Name = 'Sheet1'

    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [[42]]
    })

    const sheet1Id = engine.getSheetId(sheet1Name)!
    engine.removeSheet(sheet1Id)

    expect(() => engine.addressMapping.getStrategyForSheetOrThrow(sheet1Id)).toThrow(new NoSheetWithIdError(sheet1Id))
  })

  it('should not remove sheet from address mapping if another sheet depends on it', () => {
    const sheet1Name = 'Sheet1'
    const sheet2Name = 'Sheet2'

    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [[42]],
      [sheet2Name]: [[`='${sheet1Name}'!A1`]],
    })

    const sheet1Id = engine.getSheetId(sheet1Name)!

    engine.removeSheet(sheet1Id)

    expect(() => engine.addressMapping.getStrategyForSheetOrThrow(sheet1Id)).not.toThrow()
  })

  it('should not remove sheet from address mapping if a named expression depends on it', () => {
    const sheet1Name = 'Sheet1'
    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [[42]],
    }, {}, [
      { name: 'namedExpressionName', expression: `='${sheet1Name}'!$A$1` },
    ])

    const sheet1Id = engine.getSheetId(sheet1Name)!

    engine.removeSheet(sheet1Id)

    expect(() => engine.addressMapping.getStrategyForSheetOrThrow(sheet1Id)).not.toThrow()
  })

  it('removes the placeholder sheet from address mapping if nothing depends on it any longer', () => {
    const sheet1Name = 'Sheet1'
    const sheet2Name = 'Sheet2'

    const engine = HyperFormula.buildFromSheets({
      [sheet1Name]: [[42]],
      [sheet2Name]: [[`='${sheet1Name}'!A1`]],
    })

    const sheet1Id = engine.getSheetId(sheet1Name)!
    const sheet2Id = engine.getSheetId(sheet2Name)!

    engine.removeSheet(sheet1Id)

    expect(() => engine.addressMapping.getStrategyForSheetOrThrow(sheet1Id)).not.toThrow()

    engine.setCellContents(adr('A1', sheet2Id), 100)

    expect(() => engine.addressMapping.getStrategyForSheetOrThrow(sheet1Id)).toThrow(new NoSheetWithIdError(sheet1Id))
  })
})

describe('remove sheet - adjust range mapping', () => {
  it('should remove ranges from range mapping when removing sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['=SUM(B1:B2)'],
        ['=SUM(C1:C2)'],
      ],
      Sheet2: [
        ['=SUM(B1:B2)'],
        ['=SUM(C1:C2)'],
      ],
    })

    expect(Array.from(engine.rangeMapping.rangesInSheet(0)).length).toBe(2)
    expect(Array.from(engine.rangeMapping.rangesInSheet(1)).length).toBe(2)

    engine.removeSheet(0)

    expect(Array.from(engine.rangeMapping.rangesInSheet(0)).length).toBe(0)
    expect(Array.from(engine.rangeMapping.rangesInSheet(1)).length).toBe(2)
  })
})

describe('remove sheet - adjust matrix mapping', () => {
  it('should remove matrices from matrix mapping when removing sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['=TRANSPOSE(A1:B1)'],
      ],
      Sheet2: [
        ['1', '2'],
        ['=TRANSPOSE(A1:B1)'],
      ],
    })

    expect(engine.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))).toBeInstanceOf(ArrayFormulaVertex)

    engine.removeSheet(0)

    expect(engine.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))).toBeUndefined()
    expect(engine.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2', 1), 1, 2))).toBeInstanceOf(ArrayFormulaVertex)
  })
})

describe('remove sheet - adjust column index', () => {
  it('should remove sheet from index', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ], {useColumnIndex: true})
    const index = engine.columnSearch as ColumnIndex
    const removeSheetSpy = spyOn(index, 'removeSheet')

    engine.removeSheet(0)

    expect(removeSheetSpy).toHaveBeenCalledWith(0)
    expectArrayWithSameContent([], index.getValueIndex(0, 0, 1).index)
  })
})

describe('remove sheet - placeholder sheet behavior', () => {
  it('should return ERROR type when getting cell value from a placeholder sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [[42]],
      Sheet2: [['=Sheet1!A1']],
    })

    const sheet1Id = engine.getSheetId('Sheet1')!

    engine.removeSheet(sheet1Id)

    expect(engine.getCellValueType(adr('A1', sheet1Id))).toBe('ERROR')
  })

  it('should return null when getting serialized cell from a placeholder sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [[42]],
      Sheet2: [['=Sheet1!A1']],
    })

    const sheet1Id = engine.getSheetId('Sheet1')!

    engine.removeSheet(sheet1Id)

    const result = engine.getCellSerialized(adr('A1', sheet1Id))
    expect(result).toBeNull()
  })

  it('should remove range vertices when clearing formulas that use ranges', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2, 3],
      ['=SUM(A1:C1)'],
    ])

    expect(engine.rangeMapping.getNumberOfRangesInSheet(0)).toBe(1)

    engine.setCellContents(adr('A2'), null)

    expect(engine.rangeMapping.getNumberOfRangesInSheet(0)).toBe(0)
  })

  it('should remove range vertices when removing sheet with ranges', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [
        [1, 2, 3],
        ['=SUM(A1:C1)'],
      ],
      Sheet2: [[100]],
    })

    expect(engine.rangeMapping.getNumberOfRangesInSheet(0)).toBe(1)

    engine.removeSheet(0)

    expect(engine.rangeMapping.getNumberOfRangesInSheet(0)).toBe(0)
  })
})
