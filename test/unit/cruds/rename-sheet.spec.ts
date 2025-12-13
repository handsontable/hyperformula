import {HyperFormula, NoSheetWithIdError, SheetNameAlreadyTakenError} from '../../../src'
import {ErrorType} from '../../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('isItPossibleToRenameSheet() returns', () => {
  it('true if possible', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': []})

    expect(engine.isItPossibleToRenameSheet(0, 'Foo')).toEqual(true)
    expect(engine.isItPossibleToRenameSheet(0, '~`!@#$%^&*()_-+_=/|?{}[]\"')).toEqual(true)
  })

  it('true if same name', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': []})

    expect(engine.isItPossibleToRenameSheet(0, 'Sheet1')).toEqual(true)
  })

  it('false if sheet does not exists', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': []})

    expect(engine.isItPossibleToRenameSheet(1, 'Foo')).toEqual(false)
  })

  it('false if given name is taken', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [], 'Sheet2': []})

    expect(engine.isItPossibleToRenameSheet(0, 'Sheet2')).toEqual(false)
  })
})

describe('renameSheet()', () => {
  it('renames sheet and updates sheet mapping', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('foo')

    engine.renameSheet(0, 'bar')

    expect(engine.getSheetName(0)).toBe('bar')
    expect(engine.doesSheetExist('foo')).toBe(false)
    expect(engine.doesSheetExist('bar')).toBe(true)
  })

  it('throws error when sheet with given ID does not exist', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.renameSheet(0, 'bar')
    }).toThrow(new NoSheetWithIdError(0))
  })

  it('throws error when new sheet name is already taken', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet()
    engine.addSheet('bar')

    expect(() => {
      engine.renameSheet(0, 'bar')
    }).toThrow(new SheetNameAlreadyTakenError('bar'))
  })

  it('allows renaming to the same name (no-op)', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('foo')

    engine.renameSheet(0, 'foo')

    expect(engine.getSheetName(0)).toBe('foo')
    expect(engine.doesSheetExist('foo')).toBe(true)
  })

  it('allows changing case of the same canonical name', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('Foo')

    engine.renameSheet(0, 'FOO')

    expect(engine.getSheetName(0)).toBe('FOO')
    expect(engine.doesSheetExist('FOO')).toBe(true)
  })

  describe('recalculates formulas (issue #1116)', () => {
    it('recalculates single cell reference without quotes', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`=${newName}!A1`]],
        [oldName]: [[42]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    })

    it('recalculates single cell reference with quotes', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`='${newName}'!A1`]],
        [oldName]: [[42]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    })

    it('recalculates an aggregate function with range reference', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`=SUM('${newName}'!A1:B2)`]],
        [oldName]: [[10, 20], [30, 40]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    })

    it('recalculates chained dependencies across multiple sheets', () => {
      const sheet1Name = 'Sheet1'
      const sheet2Name = 'Sheet2'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`='${sheet2Name}'!A1+2`]],
        [sheet2Name]: [[`='${newName}'!A1*2`]],
        [oldName]: [[42]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(sheet2Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('A1', sheet2Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('A1', sheet2Id))).toBe(84)
      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(86)
    })

    it('recalculates nested dependencies within same sheet', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [['=B1*2', `='${newName}'!A1`]],
        [oldName]: [[15]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(15)
      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(30)
    })

    it('recalculates multiple cells from different sheets', () => {
      const sheet1Name = 'Sheet1'
      const sheet2Name = 'Sheet2'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`='${newName}'!A1`, `='${newName}'!B1`]],
        [sheet2Name]: [[`='${newName}'!A1+10`, `='${newName}'!B1+20`]],
        [oldName]: [[5, 7]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(sheet2Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('A1', sheet2Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet2Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(5)
      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(7)
      expect(engine.getCellValue(adr('A1', sheet2Id))).toBe(15)
      expect(engine.getCellValue(adr('B1', sheet2Id))).toBe(27)
    })

    it('recalculates formulas with mixed operations', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[100, `='${newName}'!A1 + A1`, `='${newName}'!B1 * 2`]],
        [oldName]: [[50, 25]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(150)
      expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(50)
    })

    it('recalculates formulas with range references', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`=SUM('${newName}'!A1:B5)`], [`=MEDIAN('${newName}'!A1:B5)`]],
        [oldName]: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('A2', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(55)
      expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(5.5)
    })

    it('recalculates named expressions', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [['=MyValue'], ['=MyValue*2']],
        [oldName]: [[99]],
      }, {}, [
        { name: 'MyValue', expression: `='${newName}'!$A$1` }
      ])
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('A2', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(99)
      expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(198)
    })

    it('moves reserved range vertices onto renamed sheet', () => {
      const formulaSheet = 'FormulaSheet'
      const oldName = 'SourceSheet'
      const newName = 'GhostSheet'
      const engine = HyperFormula.buildFromSheets({
        [formulaSheet]: [[`=SUM('${newName}'!A1:B1)`]],
        [oldName]: [[1, 2]],
      })
      const formulaSheetId = engine.getSheetId(formulaSheet)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', formulaSheetId))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      const renamedSheetId = engine.getSheetId(newName)!
      expect(engine.getCellValue(adr('A1', formulaSheetId))).toBe(3)

      const movedRange = engine.rangeMapping.getRangeVertex(adr('A1', renamedSheetId), adr('B1', renamedSheetId))
      expect(movedRange).not.toBeUndefined()
      expect(movedRange?.sheet).toBe(renamedSheetId)
      expect(Array.from(engine.rangeMapping.rangesInSheet(renamedSheetId))).toHaveLength(1)
    })

    it('merges duplicate range vertices after renaming into reserved name', () => {
      const oldName = 'OldName'
      const newName = 'GhostSheet'
      const usesOld = 'UsesOld'
      const usesNew = 'UsesNew'
      const engine = HyperFormula.buildFromSheets({
        [usesOld]: [[`=SUM('${oldName}'!A1:A2)`]],
        [usesNew]: [[`=SUM('${newName}'!A1:A2)`]],
        [oldName]: [[5], [7]],
      })
      const usesOldId = engine.getSheetId(usesOld)!
      const usesNewId = engine.getSheetId(usesNew)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', usesOldId))).toBe(12)
      expect(engine.getCellValue(adr('A1', usesNewId))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      const renamedSheetId = engine.getSheetId(newName)!

      expect(engine.getCellValue(adr('A1', usesOldId))).toBe(12)
      expect(engine.getCellValue(adr('A1', usesNewId))).toBe(12)

      engine.setCellContents(adr('A1', renamedSheetId), 100)

      expect(engine.getCellValue(adr('A1', usesOldId))).toBe(107)
      expect(engine.getCellValue(adr('A1', usesNewId))).toBe(107)
    })

    it('recalculates column and row ranges', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [
          [`=SUM('${newName}'!A:A)`],
          [`=SUM('${newName}'!1:2)`],
        ],
        [oldName]: [
          [1, 2],
          [3, 4],
        ],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('A2', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(4)
      expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(10)
    })

    it('keeps existing dependencies and dependents when renaming a sheet', () => {
      const mainSheetName = 'Sheet1'
      const secondarySheetName = 'Sheet2'
      const newNameForSecondarySheet = 'Sheet3'
      const engine = HyperFormula.buildFromSheets({
        [mainSheetName]: [['main sheet', `=${secondarySheetName}!A1`, `=${newNameForSecondarySheet}!A1`]],
        [secondarySheetName]: [['secondary sheet', `=${mainSheetName}!A1`]],
      })
      const mainSheetId = engine.getSheetId(mainSheetName)!
      const secondarySheetId = engine.getSheetId(secondarySheetName)!

      expect(engine.getCellValue(adr('B1', mainSheetId))).toBe('secondary sheet')
      expect(engine.getCellValue(adr('C1', mainSheetId))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', secondarySheetId))).toBe('main sheet')

      engine.renameSheet(secondarySheetId, newNameForSecondarySheet)

      expect(engine.getSheetId(newNameForSecondarySheet)).toBe(secondarySheetId)
      expect(engine.getCellValue(adr('B1', mainSheetId))).toBe('secondary sheet')
      expect(engine.getCellValue(adr('C1', mainSheetId))).toBe('secondary sheet')
      expect(engine.getCellValue(adr('B1', secondarySheetId))).toBe('main sheet')
    })

    it('removing renamed sheet returns REF error', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`='${newName}'!A1`]],
        [oldName]: [[42]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(oldNameId, newName)

      expect(engine.getSheetId(newName)).toBe(oldNameId)
      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)

      engine.removeSheet(oldNameId)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
    })

    it('adding sheet with the same name as new name of renamed sheet throws error', () => {
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [oldName]: [[42]],
      })
      const oldNameId = engine.getSheetId(oldName)!

      engine.renameSheet(oldNameId, newName)

      expect(() => {
        engine.addSheet(newName)
      }).toThrow(new SheetNameAlreadyTakenError(newName))
    })

    it('adding sheet with the old name of renamed sheet creates new sheet', () => {
      const sheet1Name = 'Sheet1'
      const oldName = 'OldName'
      const newName = 'NewName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`='${oldName}'!A1`]],
        [oldName]: [[42]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const oldNameId = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)

      engine.renameSheet(oldNameId, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)

      engine.addSheet(oldName)
      engine.setCellContents(adr('A1', engine.getSheetId(oldName)), 100)

      expect(engine.getSheetId(oldName)).not.toBe(engine.getSheetId(newName))
      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
      expect(engine.getCellValue(adr('A1', engine.getSheetId(newName)))).toBe(42)
      expect(engine.getCellValue(adr('A1', engine.getSheetId(oldName)))).toBe(100)
    })

    it('rename sheet where new name is already referenced by other existing sheet resolves REF', () => {
      const sheet1Name = 'Sheet1'
      const existingSheetName = 'ExistingSheet'
      const targetName = 'TargetName'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`='${targetName}'!A1`]],
        [existingSheetName]: [[42]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!
      const existingSheetId = engine.getSheetId(existingSheetName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(existingSheetId, targetName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    })

    it('renaming sheet that references non-existent sheet keeps REF error', () => {
      const sheet1Name = 'Sheet1'
      const newName = 'NewName'
      const nonExistent = 'NonExistent'
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: [[`='${nonExistent}'!A1`]],
      })
      const sheet1Id = engine.getSheetId(sheet1Name)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(sheet1Id, newName)

      expect(engine.getCellValue(adr('A1', engine.getSheetId(newName)))).toEqualError(detailedError(ErrorType.REF))
    })

    describe('complex range scenarios', () => {
      it('function using `runFunction`', () => {
        const engine = HyperFormula.buildFromSheets({
          'FirstSheet': [['=MEDIAN(NewName!A1:A1)', '=MEDIAN(NewName!A1:A2)', '=MEDIAN(NewName!A1:A3)', '=MEDIAN(NewName!A1:A4)']],
          'OldName': [[1], [2], [3], [4]],
        })
        const sheet1Id = engine.getSheetId('FirstSheet')!
        const sheet2Id = engine.getSheetId('OldName')!

        expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

        engine.renameSheet(sheet2Id, 'NewName')

        expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
        expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(1.5)
        expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(2)
        expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(2.5)
      })

      it('function not using `runFunction`', () => {
        const engine = HyperFormula.buildFromSheets({
          'FirstSheet': [['=SUM(NewName!A1:A1)', '=SUM(NewName!A1:A2)', '=SUM(NewName!A1:A3)', '=SUM(NewName!A1:A4)']],
          'OldName': [[1], [2], [3], [4]],
        })
        const sheet1Id = engine.getSheetId('FirstSheet')!
        const sheet2Id = engine.getSheetId('OldName')!

        expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

        engine.renameSheet(sheet2Id, 'NewName')

        expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
        expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(3)
        expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(6)
        expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(10)
      })

      it('function using `runFunction` referencing range indirectly', () => {
        const engine = HyperFormula.buildFromSheets({
          'FirstSheet': [
            ['=MEDIAN(A2)', '=MEDIAN(B2)', '=MEDIAN(C2)', '=MEDIAN(D2)'],
            [`='NewName'!A1:A1`, `='NewName'!A1:B2`, `='NewName'!A1:A3`, `='NewName'!A1:A4`],
          ],
          'OldName': [[1], [2], [3], [4]],
        })
        const sheet1Id = engine.getSheetId('FirstSheet')!
        const sheet2Id = engine.getSheetId('OldName')!

        expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

        engine.renameSheet(sheet2Id, 'NewName')

        expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
        expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(1.5)
        expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(2)
        expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(2.5)
      })

      it('function not using `runFunction` referencing range indirectly', () => {
        const engine = HyperFormula.buildFromSheets({
          'FirstSheet': [
            ['=SUM(A2)', '=SUM(B2)', '=SUM(C2)', '=SUM(D2)'],
            [`='NewName'!A1:A1`, `='NewName'!A1:B2`, `='NewName'!A1:A3`, `='NewName'!A1:A4`],
          ],
          'OldName': [[1], [2], [3], [4]],
        })
        const sheet1Id = engine.getSheetId('FirstSheet')!
        const sheet2Id = engine.getSheetId('OldName')!

        expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

        engine.renameSheet(sheet2Id, 'NewName')

        expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
        expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(3)
        expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(6)
        expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(10)
      })

      it('function calling a named expression', () => {
        const engine = HyperFormula.buildFromSheets({
          'FirstSheet': [[`='OldName'!A1:A4`]],
          'OldName': [[1], [2], [3], [4]],
        }, {}, [
          { name: 'ExprA', expression: '=MEDIAN(NewName!$A$1:$A$1)' },
          { name: 'ExprB', expression: '=MEDIAN(NewName!$A$1:$A$2)' },
          { name: 'ExprC', expression: '=MEDIAN(NewName!$A$1:$A$3)' },
        ])

        expect(engine.getNamedExpressionValue('ExprA')).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getNamedExpressionValue('ExprB')).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getNamedExpressionValue('ExprC')).toEqualError(detailedError(ErrorType.REF))

        engine.renameSheet(engine.getSheetId('OldName')!, 'NewName')

        expect(engine.getNamedExpressionValue('ExprA')).toBe(1)
        expect(engine.getNamedExpressionValue('ExprB')).toBe(1.5)
        expect(engine.getNamedExpressionValue('ExprC')).toBe(2)
      })
    })

    describe('edge cases', () => {
      it('chain renaming resolves multiple placeholder references sequentially', () => {
        const engine = HyperFormula.buildFromSheets({
          'Main': [['=SheetB!A1', '=SheetC!A1']],
          'SheetA': [[10]],
        })
        const mainId = engine.getSheetId('Main')!
        const sheetAId = engine.getSheetId('SheetA')!

        // Both are initially REF errors (placeholders)
        expect(engine.getCellValue(adr('A1', mainId))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('B1', mainId))).toEqualError(detailedError(ErrorType.REF))

        // Rename SheetA → SheetB: resolves first placeholder
        engine.renameSheet(sheetAId, 'SheetB')

        expect(engine.getCellValue(adr('A1', mainId))).toBe(10)
        expect(engine.getCellValue(adr('B1', mainId))).toEqualError(detailedError(ErrorType.REF))
        // Formula A1 now references SheetB (follows the rename)
        expect(engine.getCellFormula(adr('A1', mainId))).toBe('=SheetB!A1')

        // Add a new sheet named SheetC to resolve second placeholder
        engine.addSheet('SheetC')
        engine.setCellContents(adr('A1', engine.getSheetId('SheetC')!), 20)

        expect(engine.getCellValue(adr('A1', mainId))).toBe(10)
        expect(engine.getCellValue(adr('B1', mainId))).toBe(20)
      })

      it('renaming sheet with circular formula does not break engine', () => {
        const engine = HyperFormula.buildFromSheets({
          'Sheet1': [['=Sheet2!A1']],
          'Sheet2': [['=Sheet1!A1']],
        })
        const sheet1Id = engine.getSheetId('Sheet1')!
        const sheet2Id = engine.getSheetId('Sheet2')!

        expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.CYCLE))
        expect(engine.getCellValue(adr('A1', sheet2Id))).toEqualError(detailedError(ErrorType.CYCLE))

        engine.renameSheet(sheet1Id, 'RenamedSheet1')

        expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.CYCLE))
        expect(engine.getCellValue(adr('A1', sheet2Id))).toEqualError(detailedError(ErrorType.CYCLE))
        expect(engine.getCellFormula(adr('A1', sheet2Id))).toBe('=RenamedSheet1!A1')
      })

      it('multiple formulas referencing same placeholder all resolve after rename', () => {
        const engine = HyperFormula.buildFromSheets({
          'Sheet1': [['=Ghost!A1'], ['=Ghost!A1+1'], ['=SUM(Ghost!A1:A2)']],
          'Sheet2': [['=Ghost!A1*2'], ['=Ghost!B1']],
          'RealSheet': [[100, 200], [300]],
        })
        const sheet1Id = engine.getSheetId('Sheet1')!
        const sheet2Id = engine.getSheetId('Sheet2')!
        const realSheetId = engine.getSheetId('RealSheet')!

        expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('A2', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('A3', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('A1', sheet2Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('A2', sheet2Id))).toEqualError(detailedError(ErrorType.REF))

        engine.renameSheet(realSheetId, 'Ghost')

        expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
        expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(101)
        expect(engine.getCellValue(adr('A3', sheet1Id))).toBe(400)
        expect(engine.getCellValue(adr('A1', sheet2Id))).toBe(200)
        expect(engine.getCellValue(adr('A2', sheet2Id))).toBe(200)
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
        engine.setCellContents(adr('A1', engine.getSheetId('Source')!), 5)

        expect(engine.getCellValue(adr('A1', intermediateId))).toBe(15)
        expect(engine.getCellValue(adr('A1', mainId))).toBe(30)
      })

      it('setCellContents adds formula referencing existing sheet after it was added', () => {
        const engine = HyperFormula.buildFromSheets({
          'Main': [[1]],
        })
        const mainId = engine.getSheetId('Main')!

        engine.addSheet('NewSheet')
        const newSheetId = engine.getSheetId('NewSheet')!
        engine.setCellContents(adr('A1', newSheetId), 42)

        engine.setCellContents(adr('B1', mainId), '=NewSheet!A1')

        expect(engine.getCellValue(adr('B1', mainId))).toBe(42)

        engine.setCellContents(adr('C1', mainId), '=FutureSheet!A1')

        expect(engine.getCellValue(adr('C1', mainId))).toEqualError(detailedError(ErrorType.REF))

        engine.addSheet('FutureSheet')
        engine.setCellContents(adr('A1', engine.getSheetId('FutureSheet')!), 99)

        expect(engine.getCellValue(adr('C1', mainId))).toBe(99)
      })

      it('when new name is already referenced, engine merges both sheet names', () => {
        const engine = HyperFormula.buildFromSheets({
          'Main': [['=Source!A1', '=Target!A1']],
          'Source': [[42]],
        })
        const mainId = engine.getSheetId('Main')!
        const sourceId = engine.getSheetId('Source')!

        expect(engine.getCellValue(adr('A1', mainId))).toBe(42)
        expect(engine.getCellValue(adr('B1', mainId))).toEqualError(detailedError(ErrorType.REF))

        engine.renameSheet(sourceId, 'Target')

        expect(engine.getCellFormula(adr('A1', mainId))).toBe('=Target!A1')
        expect(engine.getCellFormula(adr('B1', mainId))).toBe('=Target!A1')
        expect(engine.getCellValue(adr('A1', mainId))).toBe(42)
        expect(engine.getCellValue(adr('B1', mainId))).toBe(42)

        engine.setCellContents(adr('A1', sourceId), 100)

        expect(engine.getCellValue(adr('A1', mainId))).toBe(100)
        expect(engine.getCellValue(adr('B1', mainId))).toBe(100)
      })

      it('handles deeply nested REF error propagation', () => {
        const engine = HyperFormula.buildFromSheets({
          'L1': [['=L2!A1+1']],
          'L2': [['=L3!A1+1']],
          'L3': [['=L4!A1+1']],
          'L4': [['=Ghost!A1']],
          'Source': [[100]],
        })
        const l1Id = engine.getSheetId('L1')!
        const l2Id = engine.getSheetId('L2')!
        const l3Id = engine.getSheetId('L3')!
        const l4Id = engine.getSheetId('L4')!
        const sourceId = engine.getSheetId('Source')!

        expect(engine.getCellValue(adr('A1', l1Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('A1', l2Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('A1', l3Id))).toEqualError(detailedError(ErrorType.REF))
        expect(engine.getCellValue(adr('A1', l4Id))).toEqualError(detailedError(ErrorType.REF))

        engine.renameSheet(sourceId, 'Ghost')

        expect(engine.getCellValue(adr('A1', l4Id))).toBe(100)
        expect(engine.getCellValue(adr('A1', l3Id))).toBe(101)
        expect(engine.getCellValue(adr('A1', l2Id))).toBe(102)
        expect(engine.getCellValue(adr('A1', l1Id))).toBe(103)
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
        engine.setCellContents(adr('A1', engine.getSheetId('Data')!), 99)

        expect(engine.getCellValue(adr('A1', mainId))).toBe(99)
      })
    })
  })
})
