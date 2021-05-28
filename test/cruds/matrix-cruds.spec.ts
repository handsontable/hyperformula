import {HyperFormula} from '../../src'
import {adr, expectEngineToBeTheSameAs, expectVerticesOfTypes, noSpace} from '../testUtils'
import {MatrixVertex, ValueCellVertex} from '../../src/DependencyGraph'
import {MatrixSize} from '../../src/MatrixSize'

describe('Create engine', () => {
  it('should create engine with array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2, '=-A1:B2'],
      [3, 4],
    ], {useArrayArithmetic: true})

    expect(engine.getSheetValues(0)).toEqual([
      [1, 2, -1, -2],
      [3, 4, -3, -4],
    ])
  })

  it('should be enough to specify only corner of an array', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E2)'],
    ], {useArrayArithmetic: true})

    expectVerticesOfTypes(engine, [
      [MatrixVertex, MatrixVertex],
      [MatrixVertex, MatrixVertex],
    ])
  })

  it('should be separate arrays', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
    ], {useArrayArithmetic: true})

    expectVerticesOfTypes(engine, [
      [MatrixVertex, MatrixVertex, null],
      [MatrixVertex, MatrixVertex, MatrixVertex],
      [null, MatrixVertex, MatrixVertex],
    ])
    expect(engine.matrixMapping.matrixMapping.size).toEqual(4)
    expect(engine.getSheetValues(0))
  })

  it('should REF last matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)', null, 1, 2],
      ['=TRANSPOSE(D1:E2)', null, null, 1, 2],
    ], {useArrayArithmetic: true})

    expectVerticesOfTypes(engine, [
      [MatrixVertex, MatrixVertex, MatrixVertex],
      [MatrixVertex, MatrixVertex, MatrixVertex],
      [null, null],
    ])
    expect(engine.getSheetValues(0)).toEqual([
      [noSpace(), 1, 1, 1, 2],
      [noSpace(), 2, 2, 1, 2],
    ])
    expect(engine.matrixMapping.matrixMapping.size).toEqual(3)
    expect(engine.getSheetValues(0))
  })

  it('array should work with different types of data', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 'foo', '=TRANSPOSE(A1:B2)'],
      [true, '=SUM(A1)'],
    ], {useArrayArithmetic: true})

    expect(engine.getSheetValues(0)).toEqual([
      [1, 'foo', 1, true],
      [true, 1, 'foo', 1],
    ])
  })

  it('should make REF matrix if no space', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-C1:D2', 2],
      [3, 4],
    ], {useArrayArithmetic: true})

    expect(engine.getSheetValues(0)).toEqual([
      [noSpace(), 2],
      [3, 4],
    ])
  })

  it('should not shrink matrix if empty vertex', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-C1:D2', null],
      [null, null]
    ], {useArrayArithmetic: true})

    expectVerticesOfTypes(engine, [
      [MatrixVertex, MatrixVertex],
      [MatrixVertex, MatrixVertex],
    ])

  })

  it('should shrink to one vertex if there is more content colliding with matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-C1:D2', null],
      [1, null]
    ], {useArrayArithmetic: true})

    expect(engine.matrixMapping.getMatrixByCorner(adr('A1'))?.matrix.size).toEqual(MatrixSize.error())
    expectVerticesOfTypes(engine, [
      [MatrixVertex, null],
      [ValueCellVertex, null],
    ])
  })
})

describe('Add rows', () => {
  it('should be possible to add row above matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-C1:D3'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [0, 1])

    const expected = HyperFormula.buildFromArray([
      [],
      ['=-C2:D4'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    expectEngineToBeTheSameAs(engine, expected)
  })

  it('adding row across array should not change array', () => {
    const engine = HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [],
      ['foo']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [4, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [], [],
      ['foo']
    ], {useArrayArithmetic: true}))
  })

  it('adding row should expand dependent array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [1, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2],
      [],
      [3, 4],
      ['=TRANSPOSE(A1:B3)']
    ], {useArrayArithmetic: true}))
  })

  it('undo add row with dependent array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [1, 1])
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true}))
  })
})

describe('Remove rows', () => {
  it('should be possible to remove row above matrix', () => {
    const engine = HyperFormula.buildFromArray([
      [],
      ['=-C2:D4'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    engine.removeRows(0, [0, 1])

    const expected = HyperFormula.buildFromArray([
      ['=-C1:D3'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    expectEngineToBeTheSameAs(engine, expected)
  })

  it('removing row across array should not change array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2], [3, 4], [5, 6],
      ['=-A1:B3'],
      [], [], [],
      ['foo']
    ], {useArrayArithmetic: true})

    engine.removeRows(0, [4, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2], [3, 4], [5, 6],
      ['=-A1:B3'],
      [], [],
      ['foo']
    ], {useArrayArithmetic: true}))
  })

  it('removing row should shrink dependent array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [],
      [3, 4],
      ['=TRANSPOSE(A1:B3)']
    ], {useArrayArithmetic: true})

    engine.removeRows(0, [1, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], {useArrayArithmetic: true}))
  })

  it('it should be REF if no space after removing row', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-B3:B4'],
      [],
      [1, 1],
      [null, 2],
    ], {useArrayArithmetic: true})

    engine.removeRows(0, [1, 1])

    expect(engine.getSheetValues(0)).toEqual([
      [noSpace()],
      [1, 1],
      [null, 2],
    ])

    const expected = HyperFormula.buildFromArray([
      ['=-B2:B3'],
      [1, 1],
      [null, 2]
    ], {useArrayArithmetic: true})
    expectEngineToBeTheSameAs(engine, expected)
  })

  it('it should be REF, not CYCLE, after removing rows', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-A3:A4'],
      [],
      [1],
      [2]
    ], {useArrayArithmetic: true})

    engine.removeRows(0, [1, 1])

    expect(engine.getSheetValues(0)).toEqual([
      [noSpace()],
      [1],
      [2]
    ])

    const expected = HyperFormula.buildFromArray([
      ['=-A2:A3'],
      [1],
      [2]
    ], {useArrayArithmetic: true})
    expectEngineToBeTheSameAs(engine, expected)
  })
})

describe('Set cell content', () => {
  it('should set matrix to cell', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
    ], {useArrayArithmetic: true})

    engine.setCellContents(adr('C1'), [['=-A1:B2']])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2, '=-A1:B2'],
      [3, 4],
    ], {useArrayArithmetic: true}))
  })

  it('should be REF matrix if no space for result', () => {
    const engine = HyperFormula.buildFromArray([
      [],
      [1],
    ], {useArrayArithmetic: true})

    engine.setCellContents(adr('A1'), [['=-B2:B3']])

    expect(engine.getCellValue(adr('A1'))).toEqual(noSpace())
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['=-B2:B3'],
      [1],
    ], {useArrayArithmetic: true}))
  })

  it('should be REF matrix if no space and potential cycle', () => {
    const engine = HyperFormula.buildFromArray([
      [],
      [1],
    ], {useArrayArithmetic: true})

    engine.setCellContents(adr('A1'), [['=-A2:A3']])

    expect(engine.getCellValue(adr('A1'))).toEqual(noSpace())
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['=-A2:A3'],
      [1],
    ], {useArrayArithmetic: true}))
  })

  it('should shrink to one vertex if there is more content colliding with matrix', () => {
    const engine = HyperFormula.buildFromArray([], {useArrayArithmetic: true})

    engine.setCellContents(adr('A1'), [
      ['=-C1:D2', null],
      [1, null]
    ])

    expect(engine.matrixMapping.getMatrixByCorner(adr('A1'))?.matrix.size).toEqual(MatrixSize.error())
    expectVerticesOfTypes(engine, [
      [MatrixVertex, null],
      [ValueCellVertex, null],
    ])
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['=-C1:D2', null],
      [1, null]
    ], {useArrayArithmetic: true}))
  })

  it('should be separate arrays', () => {
    const engine = HyperFormula.buildFromArray([], {useArrayArithmetic: true})

    engine.setCellContents(adr('A1'), [
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
    ])

    expectVerticesOfTypes(engine, [
      [MatrixVertex, MatrixVertex, null],
      [MatrixVertex, MatrixVertex, MatrixVertex],
      [null, MatrixVertex, MatrixVertex],
    ])
    expect(engine.matrixMapping.matrixMapping.size).toEqual(4)
    expect(engine.getSheetValues(0))
  })

  it('should REF last matrix', () => {
    const engine = HyperFormula.buildFromArray([
      [null, null, null, 1, 2],
      [null, null, null, 1, 2],
    ], {useArrayArithmetic: true})

    engine.setCellContents(adr('A1'), [
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
      ['=TRANSPOSE(D1:E2)'],
    ])

    expectVerticesOfTypes(engine, [
      [MatrixVertex, MatrixVertex, MatrixVertex],
      [MatrixVertex, MatrixVertex, MatrixVertex],
      [null, null],
    ])
    expect(engine.getSheetValues(0)).toEqual([
      [noSpace(), 1, 1, 1, 2],
      [noSpace(), 2, 2, 1, 2],
    ])
    expect(engine.matrixMapping.matrixMapping.size).toEqual(3)
    expect(engine.getSheetValues(0))
  })
})
