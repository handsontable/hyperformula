import {HyperFormula} from '../../src'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'

describe('setting row order - checking if it is possible', () => {
  it('should validate numbers for negative rows', () => {
    const engine = HyperFormula.buildFromArray([[]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[-1, 0]])).toEqual(false)
    expect(() =>
      engine.swapRowIndexes(0, [[-1, 0]])
    ).toThrowError('Invalid arguments, expected row numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources for noninteger values', () => {
    const engine = HyperFormula.buildFromArray([[]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[1, 1], [0.5, 0]])).toEqual(false)
    expect(() =>
      engine.swapRowIndexes(0, [[1, 1], [0.5, 0]])
    ).toThrowError('Invalid arguments, expected row numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources for values exceeding sheet height', () => {
    const engine = HyperFormula.buildFromArray([[0], [0], [0]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[1, 1], [3, 0]])).toEqual(false)
    expect(() =>
      engine.swapRowIndexes(0, [[1, 1], [3, 0]])
    ).toThrowError('Invalid arguments, expected row numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources to be unique', () => {
    const engine = HyperFormula.buildFromArray([[0], [0], [0]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 0], [1, 1], [1, 2]])).toEqual(false)
    expect(() =>
      engine.swapRowIndexes(0, [[0, 0], [1, 1], [1, 2]])
    ).toThrowError('Invalid arguments, expected source row numbers to be unique.')
  })

  it('should validate sources to be permutation of targets', () => {
    const engine = HyperFormula.buildFromArray([[0], [0], [0]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 0], [1, 1], [2, 1]])).toEqual(false)
    expect(() =>
      engine.swapRowIndexes(0, [[0, 0], [1, 1], [2, 1]])
    ).toThrowError('Invalid arguments, expected target row numbers to be permutation of source row numbers.')
  })

  it('should check for matrices', () => {
    const engine = HyperFormula.buildFromArray([[0], [0], ['{=1}']])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 2], [1, 1], [2, 0]])).toEqual(false)
    expect(() =>
      engine.swapRowIndexes(0, [[0, 2], [1, 1], [2, 0]])
    ).toThrowError('Cannot perform this operation, source location has a matrix inside.')
  })

  it('should check for matrices only in moved rows', () => {
    const engine = HyperFormula.buildFromArray([[0], ['{=1}'], [0]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 2], [1, 1], [2, 0]])).toEqual(true)
    expect(() =>
      engine.swapRowIndexes(0, [[0, 2], [1, 1], [2, 0]])
    ).not.toThrowError()
  })
})

describe('should correctly work', () => {
  it('should work on static engine', () => {
    const engine = HyperFormula.buildFromArray([[1, 'abcd', 3], [3, 5, true]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 0]])).toEqual(true)
    engine.swapRowIndexes(0, [[0, 1], [1, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[3, 5, true], [1, 'abcd', 3]])
  })

  it('should return number of changed cells', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 0]])).toEqual(true)
    const ret = engine.swapRowIndexes(0, [[0, 1], [1, 0]])
    expect(ret.length).toEqual(6)
  })

  it('should work on static engine with uneven rows', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6, 7, 8]], {chooseAddressMappingPolicy: new AlwaysSparse()})
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 0]])).toEqual(true)
    engine.swapRowIndexes(0, [[0, 1], [1, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[4, 5, 6, 7, 8], [1, 2, 3]])
  })

  it('should work with more complicated permutations', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6]])
  })

  it('should not move values unnecessarily', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 0], [1, 1]])).toEqual(true)
    const ret = engine.swapRowIndexes(0, [[0, 0], [1, 1]])
    expect(ret.length).toEqual(0)
  })

  it('should work with external references', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
    engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], ['=A1', '=SUM(A2:A3)']])
    expect(engine.getSheetValues(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], [7, 5]])
  })

  it('should work with internal references', () => {
    const engine = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([['=SUM(#REF!)', 8, 9], ['=A3', '=SUM(B3:B4)', 3], ['=A11', '=SUM(B11:B16)', 6]])
  })
})

describe('reorder working with undo', () => {
  it('should work on static engine', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('should work with external references', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
    engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
  })

  it('should work with internal references', () => {
    const engine = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
    engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
  })
})

describe('reorder working with redo', () => {
  it('should work on static engine', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6]])
  })

  it('should work with external references', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
    engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], ['=A1', '=SUM(A2:A3)']])
    expect(engine.getSheetValues(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], [7, 5]])
  })

  it('should work with internal references', () => {
    const engine = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
    engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([['=SUM(#REF!)', 8, 9], ['=A3', '=SUM(B3:B4)', 3], ['=A11', '=SUM(B11:B16)', 6]])
  })
})
