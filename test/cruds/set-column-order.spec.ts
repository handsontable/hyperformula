import {HyperFormula} from '../../src'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {adr} from '../testUtils'

describe('swapping columns - checking if it is possible', () => {
  it('should validate numbers for negative columns', () => {
    const [engine] = HyperFormula.buildFromArray([[]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[-1, 0]])).toEqual(false)
    expect(() =>
      engine.swapColumnIndexes(0, [[-1, 0]])
    ).toThrowError('Invalid arguments, expected column numbers to be nonnegative integers and less than sheet width.')
  })

  it('should validate sources for noninteger values', () => {
    const [engine] = HyperFormula.buildFromArray([[]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[1, 1], [0.5, 0]])).toEqual(false)
    expect(() =>
      engine.swapColumnIndexes(0, [[1, 1], [0.5, 0]])
    ).toThrowError('Invalid arguments, expected column numbers to be nonnegative integers and less than sheet width.')
  })

  it('should validate sources for values exceeding sheet width', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 0, 0]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[1, 1], [3, 0]])).toEqual(false)
    expect(() =>
      engine.swapColumnIndexes(0, [[3, 0]])
    ).toThrowError('Invalid arguments, expected column numbers to be nonnegative integers and less than sheet width.')
  })

  it('should validate sources to be unique', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 0, 0]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 0], [1, 1], [1, 2]])).toEqual(false)
    expect(() =>
      engine.swapColumnIndexes(0, [[0, 0], [1, 1], [1, 2]])
    ).toThrowError('Invalid arguments, expected source column numbers to be unique.')
  })

  it('should validate sources to be permutation of targets', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 0, 0]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 0], [1, 1], [2, 1]])).toEqual(false)
    expect(() =>
      engine.swapColumnIndexes(0, [[0, 0], [1, 1], [2, 1]])
    ).toThrowError('Invalid arguments, expected target column numbers to be permutation of source column numbers.')
  })

  it('should check for matrices', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 0, '=TRANSPOSE(A1:B1)']])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 2], [1, 1], [2, 0]])).toEqual(false)
    expect(() =>
      engine.swapColumnIndexes(0, [[0, 2], [1, 1], [2, 0]])
    ).toThrowError('Cannot perform this operation, source location has an array inside.')
  })

  it('should check for matrices only in moved columns', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 0, '=TRANSPOSE(A1:B1)']])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 0], [2, 2]])).toEqual(true)
    expect(() =>
      engine.swapColumnIndexes(0, [[0, 1], [1, 0], [2, 2]])
    ).not.toThrowError()
  })
})

describe('swapping columns should correctly work', () => {
  it('should work on static engine', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 'abcd'], [3, 3], [5, true]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 0]])).toEqual(true)
    engine.swapColumnIndexes(0, [[0, 1], [1, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([['abcd', 1], [3, 3], [true, 5]])
  })

  it('should return number of changed cells', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2], [3, 4], [5, 6]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 0]])).toEqual(true)
    const [ret] = engine.swapColumnIndexes(0, [[0, 1], [1, 0]])
    expect(ret.length).toEqual(6)
  })

  it('should work on static engine with uneven column', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2], [3, 4], [5]], {chooseAddressMappingPolicy: new AlwaysSparse()})
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 0]])).toEqual(true)
    engine.swapColumnIndexes(0, [[0, 1], [1, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[2, 1], [4, 3], [null, 5]])
  })

  it('should work with more complicated permutations', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.swapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2], [6, 4, 5], [9, 7, 8]])
  })

  it('should not move values unnecessarily', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 0], [1, 1]])).toEqual(true)
    const [ret] = engine.swapColumnIndexes(0, [[0, 0], [1, 1]])
    expect(ret.length).toEqual(0)
  })

  it('should work with external references', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.swapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2, '=A1', '=SUM(A2:A3)'], [6, 4, 5], [9, 7, 8]])
    expect(engine.getSheetValues(0)).toEqual([[3, 1, 2, 3, 15], [6, 4, 5], [9, 7, 8]])
  })

  it('should work with internal references', () => {
    const [engine] = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.swapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[3, '=B2', '=SUM(C2:C3)'], ['=#REF!', 1, '=SUM(C10:C15)'], [9, '=SUM(E1:E10)', 8]])
  })
})

describe('swapping rows working with undo', () => {
  it('should work on static engine', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    engine.swapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('should work with external references', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
    engine.swapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
  })

  it('should work with internal references', () => {
    const [engine] = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
    engine.swapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
  })
})

describe('swapping rows working with redo', () => {
  it('should work on static engine', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    engine.swapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2], [6, 4, 5], [9, 7, 8]])
  })

  it('should work with external references', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
    engine.swapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2, '=A1', '=SUM(A2:A3)'], [6, 4, 5], [9, 7, 8]])
    expect(engine.getSheetValues(0)).toEqual([[3, 1, 2, 3, 15], [6, 4, 5], [9, 7, 8]])
  })

  it('should work with internal references', () => {
    const [engine] = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
    engine.swapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[3, '=B2', '=SUM(C2:C3)'], ['=#REF!', 1, '=SUM(C10:C15)'], [9, '=SUM(E1:E10)', 8]])
  })

  it('clears redo stack', () => {
    const [engine] = HyperFormula.buildFromArray([[1]])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.swapColumnIndexes(0, [[0, 0]])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('setting column order - checking if it is possible', () => {
  it('should check for length', () => {
    const [engine] = HyperFormula.buildFromArray([[]])
    expect(engine.isItPossibleToSetColumnOrder(0, [0])).toEqual(false)
    expect(() =>
      engine.setColumnOrder(0, [0])
    ).toThrowError('Invalid arguments, expected number of columns provided to be sheet width.')
  })

  it('should validate sources for noninteger values', () => {
    const [engine] = HyperFormula.buildFromArray([[]])
    expect(engine.isItPossibleToSetColumnOrder(0, [0, 0.5])).toEqual(false)
    expect(() =>
      engine.setColumnOrder(0, [0, 0.5])
    ).toThrowError('Invalid arguments, expected number of columns provided to be sheet width.')
  })

  it('should validate for repeated values', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 0, 0]])
    expect(engine.isItPossibleToSetColumnOrder(0, [0, 1, 1])).toEqual(false)
    expect(() =>
      engine.setColumnOrder(0, [0, 1, 1])
    ).toThrowError('Invalid arguments, expected target column numbers to be permutation of source column numbers.')
  })

  it('should validate sources to be permutation of targets', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 0, 0]])
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 2, 3])).toEqual(false)
    expect(() =>
      engine.setColumnOrder(0, [1, 2, 3])
    ).toThrowError('Invalid arguments, expected target column numbers to be permutation of source column numbers.')
  })

  it('should check for matrices', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 0, '=TRANSPOSE(A1:B1)']])
    expect(engine.isItPossibleToSetColumnOrder(0, [2, 1, 0])).toEqual(false)
    expect(() =>
      engine.setColumnOrder(0, [2, 1, 0])
    ).toThrowError('Cannot perform this operation, source location has an array inside.')
  })

  it('should check for matrices only in moved columns', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 0, '=TRANSPOSE(A1:B1)']])
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 0, 2])).toEqual(true)
    expect(() =>
      engine.setColumnOrder(0, [1, 0, 2])
    ).not.toThrowError()
  })
})

describe('reorder base case', () => {
  it('should work on static engine', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 'abcd'], [3, 3], [5, true]])
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 0])).toEqual(true)
    engine.setColumnOrder(0, [1, 0])
    expect(engine.getSheetSerialized(0)).toEqual([['abcd', 1], [3, 3], [true, 5]])
  })

  it('should return number of changed cells', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2], [3, 4], [5, 6]])
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 0])).toEqual(true)
    const [ret] = engine.setColumnOrder(0, [1, 0])
    expect(ret.length).toEqual(6)
  })

  it('should work on static engine with uneven column', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2], [3, 4], [5]], {chooseAddressMappingPolicy: new AlwaysSparse()})
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 0])).toEqual(true)
    engine.setColumnOrder(0, [1, 0])
    expect(engine.getSheetSerialized(0)).toEqual([[2, 1], [4, 3], [null, 5]])
  })

  it('should work with more complicated permutations', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 2, 0])).toEqual(true)
    engine.setColumnOrder(0, [1, 2, 0])
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2], [6, 4, 5], [9, 7, 8]])
  })

  it('should not move values unnecessarily', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6]])
    expect(engine.isItPossibleToSetColumnOrder(0, [0, 1, 2])).toEqual(true)
    const [ret] = engine.setColumnOrder(0, [0, 1, 2])
    expect(ret.length).toEqual(0)
  })

  it('should work with external references', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 2, 0, 3, 4])).toEqual(true)
    engine.setColumnOrder(0, [1, 2, 0, 3, 4])
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2, '=A1', '=SUM(A2:A3)'], [6, 4, 5], [9, 7, 8]])
    expect(engine.getSheetValues(0)).toEqual([[3, 1, 2, 3, 15], [6, 4, 5], [9, 7, 8]])
  })

  it('should work with internal references', () => {
    const [engine] = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 2, 0, 3])).toEqual(true)
    engine.setColumnOrder(0, [1, 2, 0, 3])
    expect(engine.getSheetSerialized(0)).toEqual([[3, '=B2', '=SUM(C2:C3)'], ['=#REF!', 1, '=SUM(C10:C15)'], [9, '=SUM(E1:E10)', 8]])
  })
})

describe('reorder working with undo', () => {
  it('should work on static engine', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [1, 2, 0])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('should work with external references', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [1, 2, 0, 3, 4])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
  })

  it('should work with internal references', () => {
    const [engine] = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
    engine.setColumnOrder(0, [1, 2, 0, 3])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
  })
})

describe('reorder working with redo', () => {
  it('should work on static engine', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [1, 2, 0])
    engine.undo()
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 2, 0])).toEqual(true)
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2], [6, 4, 5], [9, 7, 8]])
  })

  it('should work with external references', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [1, 2, 0, 3, 4])
    engine.undo()
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 2, 0, 3, 4])).toEqual(true)
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2, '=A1', '=SUM(A2:A3)'], [6, 4, 5], [9, 7, 8]])
    expect(engine.getSheetValues(0)).toEqual([[3, 1, 2, 3, 15], [6, 4, 5], [9, 7, 8]])
  })

  it('should work with internal references', () => {
    const [engine] = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
    engine.setColumnOrder(0, [1, 2, 0, 3])
    engine.undo()
    expect(engine.isItPossibleToSetColumnOrder(0, [1, 2, 0, 3, 4])).toEqual(true)
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[3, '=B2', '=SUM(C2:C3)'], ['=#REF!', 1, '=SUM(C10:C15)'], [9, '=SUM(E1:E10)', 8]])
  })

  it('clears redo stack', () => {
    const [engine] = HyperFormula.buildFromArray([[1]])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.setColumnOrder(0, [0])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})
