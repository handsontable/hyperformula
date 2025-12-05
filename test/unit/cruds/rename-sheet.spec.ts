import {HyperFormula, NoSheetWithIdError, SheetNameAlreadyTakenError} from '../../../src'
import {ErrorType} from '../../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Is it possible to rename sheet', () => {
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

describe('Rename sheet', () => {
  it('works', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('foo')

    engine.renameSheet(0, 'bar')

    expect(engine.getSheetName(0)).toBe('bar')
    expect(engine.doesSheetExist('foo')).toBe(false)
    expect(engine.doesSheetExist('bar')).toBe(true)
  })

  it('error when there is no sheet with given ID', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.renameSheet(0, 'bar')
    }).toThrow(new NoSheetWithIdError(0))
  })

  it('error when new sheet name is already taken', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet()
    engine.addSheet('bar')

    expect(() => {
      engine.renameSheet(0, 'bar')
    }).toThrow(new SheetNameAlreadyTakenError('bar'))
  })

  it('change for the same name', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('foo')

    engine.renameSheet(0, 'foo')

    expect(engine.getSheetName(0)).toBe('foo')
    expect(engine.doesSheetExist('foo')).toBe(true)
  })

  it('change for the same canonical name', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('Foo')

    engine.renameSheet(0, 'FOO')

    expect(engine.getSheetName(0)).toBe('FOO')
    expect(engine.doesSheetExist('FOO')).toBe(true)
  })

  it('should update the sheet dependencies', () => {
    const engine = HyperFormula.buildFromSheets({'OldSheetName': [[42]], 'DependantSheet': [['=OldSheetName!A1']]})

    engine.renameSheet(0, 'NewSheetName')

    expect(engine.getCellFormula({ sheet: 1, row: 0, col: 0 })).toEqual('=NewSheetName!A1')
  })
})

describe('rename sheet - issue #1116', () => {
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

    engine.renameSheet(oldNameId, newName) // trudny case: trzeba przepiac krawedzie w grafie z zarezerwowanego sheeta na ten renamowany

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
      const sheet1Name = 'FirstSheet'
      const oldName = 'OldName'
      const newName = 'NewName'
      const sheet1Data = [[`=MEDIAN(${newName}!A1:A1)`, `=MEDIAN(${newName}!A1:A2)`, `=MEDIAN(${newName}!A1:A3)`, `=MEDIAN(${newName}!A1:A4)`]]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [oldName]: sheet2Data,
      })

      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(sheet2Id, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(1.5)
      expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(2)
      expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(2.5)
    })

    it('function not using `runFunction`', () => {
      const sheet1Name = 'FirstSheet'
      const oldName = 'OldName'
      const newName = 'NewName'
      const sheet1Data = [[`=SUM(${newName}!A1:A1)`, `=SUM(${newName}!A1:A2)`, `=SUM(${newName}!A1:A3)`, `=SUM(${newName}!A1:A4)`]]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [oldName]: sheet2Data,
      })

      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(sheet2Id, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(3)
      expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(6)
      expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(10)
    })

    it('function using `runFunction` referencing range indirectly', () => {
      const sheet1Name = 'FirstSheet'
      const oldName = 'OldName'
      const newName = 'NewName'
      const sheet1Data = [
        ['=MEDIAN(A2)', '=MEDIAN(B2)', '=MEDIAN(C2)', '=MEDIAN(D2)'],
        [`='${newName}'!A1:A1`, `='${newName}'!A1:B2`, `='${newName}'!A1:A3`, `='${newName}'!A1:A4`],
      ]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [oldName]: sheet2Data,
      })

      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(sheet2Id, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(1.5)
      expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(2)
      expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(2.5)
    })

    it('function not using `runFunction` referencing range indirectly', () => {
      const sheet1Name = 'FirstSheet'
      const oldName = 'OldName'
      const newName = 'NewName'
      const sheet1Data = [
        ['=SUM(A2)', '=SUM(B2)', '=SUM(C2)', '=SUM(D2)'],
        [`='${newName}'!A1:A1`, `='${newName}'!A1:B2`, `='${newName}'!A1:A3`, `='${newName}'!A1:A4`],
      ]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [oldName]: sheet2Data,
      })

      const sheet1Id = engine.getSheetId(sheet1Name)!
      const sheet2Id = engine.getSheetId(oldName)!

      expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('C1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(sheet2Id, newName)

      expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
      expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(3)
      expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(6)
      expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(10)
    })

    it('function calling a named expression', () => {
      const sheet1Name = 'FirstSheet'
      const oldName = 'OldName'
      const newName = 'NewName'
      const sheet1Data = [[`='${oldName}'!A1:A4`]]
      const sheet2Data = [[1], [2], [3], [4]]
      const engine = HyperFormula.buildFromSheets({
        [sheet1Name]: sheet1Data,
        [oldName]: sheet2Data,
      }, {}, [
        { name: 'ExprA', expression: `=MEDIAN(${newName}!$A$1:$A$1)` },
        { name: 'ExprB', expression: `=MEDIAN(${newName}!$A$1:$A$2)` },
        { name: 'ExprC', expression: `=MEDIAN(${newName}!$A$1:$A$3)` },
        { name: 'ExprD', expression: `=MEDIAN(${sheet1Name}!$A$1)` }
      ])

      const sheet2Id = engine.getSheetId(oldName)!

      expect(engine.getNamedExpressionValue('ExprA')).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getNamedExpressionValue('ExprB')).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getNamedExpressionValue('ExprC')).toEqualError(detailedError(ErrorType.REF))
      expect(engine.getNamedExpressionValue('ExprD')).toEqualError(detailedError(ErrorType.REF))

      engine.renameSheet(sheet2Id, newName)

      expect(engine.getNamedExpressionValue('ExprA')).toBe(1)
      expect(engine.getNamedExpressionValue('ExprB')).toBe(1.5)
      expect(engine.getNamedExpressionValue('ExprC')).toBe(2)
      expect(engine.getNamedExpressionValue('ExprD')).toBe(2.5)
    })
  })
})
