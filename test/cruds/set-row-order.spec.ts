import {HyperFormula} from '../../src'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {adr} from '../testUtils'

describe('swapping rows - checking if it is possible', () => {
  it('should validate numbers for negative rows', async() => {
const engine = await HyperFormula.buildFromArray([[]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[-1, 0]])).toEqual(false)
    expect(async() =>
      await engine.swapRowIndexes(0, [[-1, 0]])
    ).toThrowError('Invalid arguments, expected row numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources for noninteger values', async() => {
const engine = await HyperFormula.buildFromArray([[]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[1, 1], [0.5, 0]])).toEqual(false)
    expect(async() =>
      await engine.swapRowIndexes(0, [[1, 1], [0.5, 0]])
    ).toThrowError('Invalid arguments, expected row numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources for values exceeding sheet height', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0], [0]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[1, 1], [3, 0]])).toEqual(false)
    expect(async() =>
      await engine.swapRowIndexes(0, [[3, 0]])
    ).toThrowError('Invalid arguments, expected row numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources to be unique', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0], [0]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 0], [1, 1], [1, 2]])).toEqual(false)
    expect(async() =>
      await engine.swapRowIndexes(0, [[0, 0], [1, 1], [1, 2]])
    ).toThrowError('Invalid arguments, expected source row numbers to be unique.')
  })

  it('should validate sources to be permutation of targets', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0], [0]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 0], [1, 1], [2, 1]])).toEqual(false)
    expect(async() =>
      await engine.swapRowIndexes(0, [[0, 0], [1, 1], [2, 1]])
    ).toThrowError('Invalid arguments, expected target row numbers to be permutation of source row numbers.')
  })

  it('should check for matrices', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0], ['=TRANSPOSE(A1:A2)']])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 2], [1, 1], [2, 0]])).toEqual(false)
    expect(async() =>
      await engine.swapRowIndexes(0, [[0, 2], [1, 1], [2, 0]])
    ).toThrowError('Cannot perform this operation, source location has an array inside.')
  })

  it('should check for matrices only in moved rows', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0], ['=TRANSPOSE(A1:A2)']])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 0], [2, 2]])).toEqual(true)
    expect(() =>
      await engine.swapRowIndexes(0, [[0, 1], [1, 0], [2, 2]])
    ).not.toThrowError()
  })
})

describe('swapping rows should correctly work', () => {
  it('should work on static engine', async() => {
const engine = await HyperFormula.buildFromArray([[1, 'abcd', 3], [3, 5, true]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 0]])).toEqual(true)
    await engine.swapRowIndexes(0, [[0, 1], [1, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[3, 5, true], [1, 'abcd', 3]])
  })

  it('should return number of changed cells', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 0]])).toEqual(true)
    const ret = await engine.swapRowIndexes(0, [[0, 1], [1, 0]])
    expect(ret.length).toEqual(6)
  })

  it('should work on static engine with uneven rows', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6, 7, 8]], {chooseAddressMappingPolicy: new AlwaysSparse()})
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 0]])).toEqual(true)
    await engine.swapRowIndexes(0, [[0, 1], [1, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[4, 5, 6, 7, 8], [1, 2, 3]])
  })

  it('should work with more complicated permutations', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    await engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6]])
  })

  it('should not move values unnecessarily', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 0], [1, 1]])).toEqual(true)
    const ret = await engine.swapRowIndexes(0, [[0, 0], [1, 1]])
    expect(ret.length).toEqual(0)
  })

  it('should work with external references', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
    await engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], ['=A1', '=SUM(A2:A3)']])
    expect(engine.getSheetValues(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], [7, 5]])
  })

  it('should work with internal references', async() => {
const engine = await HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    await engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([['=SUM(#REF!)', 8, 9], ['=A3', '=SUM(B3:B4)', 3], ['=A11', '=SUM(B11:B16)', 6]])
  })
})

describe('swapping rows working with undo', () => {
  it('should work on static engine', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    await engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    await engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('should work with external references', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
    await engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    await engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
  })

  it('should work with internal references', async() => {
const engine = await HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
    await engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    await engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
  })
})

describe('swapping rows working with redo', () => {
  it('should work on static engine', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    await engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    await engine.undo()
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    await engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6]])
  })

  it('should work with external references', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
    await engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    await engine.undo()
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    await engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], ['=A1', '=SUM(A2:A3)']])
    expect(engine.getSheetValues(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], [7, 5]])
  })

  it('should work with internal references', async() => {
const engine = await HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
    await engine.swapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])
    await engine.undo()
    expect(engine.isItPossibleToSwapRowIndexes(0, [[0, 1], [1, 2], [2, 0]])).toEqual(true)
    await engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([['=SUM(#REF!)', 8, 9], ['=A3', '=SUM(B3:B4)', 3], ['=A11', '=SUM(B11:B16)', 6]])
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([[1]])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.swapRowIndexes(0, [[0, 0]])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

function fillValues(order: number[], fill: number): number[] {
  while(order.length < fill) {
    const x = order.length
    order[x] = x
  }
  return order
}

describe('setting row order - checking if it is possible', () => {
  it('should check for length', async() => {
const engine = await HyperFormula.buildFromArray([[]])
    expect(engine.isItPossibleToSetRowOrder(0, [0])).toEqual(false)
    expect(() =>
      await engine.setRowOrder(0, [0])
    ).toThrowError('Invalid arguments, expected number of rows provided to be sheet height.')
  })

  it('should validate sources for noninteger values', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0]])
    expect(engine.isItPossibleToSetRowOrder(0, [0, 0.5])).toEqual(false)
    expect(() =>
      await engine.setRowOrder(0, [0, 0.5])
    ).toThrowError('Invalid arguments, expected target row numbers to be permutation of source row numbers.')
  })

  it('should validate for repeated values', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0], [0]])
    expect(engine.isItPossibleToSetRowOrder(0, [0, 1, 1])).toEqual(false)
    expect(() =>
      await engine.setRowOrder(0, [0, 1, 1])
    ).toThrowError('Invalid arguments, expected target row numbers to be permutation of source row numbers.')
  })

  it('should validate sources to be permutation of targets', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0], [0]])
    expect(engine.isItPossibleToSetRowOrder(0, [1, 2, 3])).toEqual(false)
    expect(() =>
      await engine.setRowOrder(0, [1, 2, 3])
    ).toThrowError('Invalid arguments, expected target row numbers to be permutation of source row numbers.')
  })

  it('should check for matrices', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0], ['=TRANSPOSE(A1:A2)']])
    expect(engine.isItPossibleToSetRowOrder(0, [2, 1, 0])).toEqual(false)
    expect(() =>
      await engine.setRowOrder(0, [2, 1, 0])
    ).toThrowError('Cannot perform this operation, source location has an array inside.')
  })

  it('should check for matrices only in moved rows', async() => {
const engine = await HyperFormula.buildFromArray([[0], [0], ['=TRANSPOSE(A1:A2)']])
    expect(engine.isItPossibleToSetRowOrder(0, [1, 0, 2])).toEqual(true)
    expect(() =>
      await engine.setRowOrder(0, [1, 0, 2])
    ).not.toThrowError()
  })
})

describe('reorder base case', () => {
  it('should work on static engine', async() => {
const engine = await HyperFormula.buildFromArray([[1, 'abcd', 3], [3, 5, true]])
    expect(engine.isItPossibleToSetRowOrder(0, [1, 0])).toEqual(true)
    await engine.setRowOrder(0, [1, 0])
    expect(engine.getSheetSerialized(0)).toEqual([[3, 5, true], [1, 'abcd', 3]])
  })

  it('should return number of changed cells', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6]])
    expect(engine.isItPossibleToSetRowOrder(0, [1, 0])).toEqual(true)
    const ret = await engine.setRowOrder(0, [1, 0])
    expect(ret.length).toEqual(6)
  })

  it('should work on static engine with uneven rows', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6, 7, 8]], {chooseAddressMappingPolicy: new AlwaysSparse()})
    expect(engine.isItPossibleToSetRowOrder(0, [1, 0])).toEqual(true)
    await engine.setRowOrder(0, [1, 0])
    expect(engine.getSheetSerialized(0)).toEqual([[4, 5, 6, 7, 8], [1, 2, 3]])
  })

  it('should work with more complicated permutations', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    expect(engine.isItPossibleToSetRowOrder(0, [1, 2, 0])).toEqual(true)
    await engine.setRowOrder(0, [1, 2, 0])
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6]])
  })

  it('should not move values unnecessarily', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6]])
    expect(engine.isItPossibleToSetRowOrder(0, [0, 1])).toEqual(true)
    const ret = await engine.setRowOrder(0, [0, 1])
    expect(ret.length).toEqual(0)
  })

  it('should work with external references', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
    await engine.setRowOrder(0, [1, 2, 0, 3])
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], ['=A1', '=SUM(A2:A3)']])
    expect(engine.getSheetValues(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], [7, 5]])
  })

  it('should work with internal references', async() => {
const engine = await HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
    expect(engine.isItPossibleToSetRowOrder(0, fillValues([1, 2, 0], 15))).toEqual(true)
    await engine.setRowOrder(0, fillValues([1, 2, 0], 15))
    expect(engine.getSheetSerialized(0)).toEqual([['=SUM(#REF!)', 8, 9], ['=A3', '=SUM(B3:B4)', 3], ['=A11', '=SUM(B11:B16)', 6]])
  })
})

describe('reorder working with undo', () => {
  it('should work on static engine', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    await engine.setRowOrder(0, [1, 2, 0])
    await engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('should work with external references', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
    await engine.setRowOrder(0, [1, 2, 0, 3])
    await engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
  })

  it('should work with internal references', async() => {
const engine = await HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
    await engine.setRowOrder(0, fillValues([1, 2, 0], 15))
    await engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
  })
})

describe('reorder working with redo', () => {
  it('should work on static engine', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    await engine.setRowOrder(0, [1, 2, 0])
    await engine.undo()
    expect(engine.isItPossibleToSetRowOrder(0, [1, 2, 0])).toEqual(true)
    await engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6]])
  })

  it('should work with external references', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9], ['=A1', '=SUM(A2:A3)']])
    await engine.setRowOrder(0, [1, 2, 0, 3])
    await engine.undo()
    expect(engine.isItPossibleToSetRowOrder(0, [1, 2, 0, 3])).toEqual(true)
    await engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], ['=A1', '=SUM(A2:A3)']])
    expect(engine.getSheetValues(0)).toEqual([[7, 8, 9], [1, 2, 3], [4, 5, 6], [7, 5]])
  })

  it('should work with internal references', async() => {
const engine = await HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], ['=A10', '=SUM(B10:B15)', 6], ['=SUM(C1:C10)', 8, 9]])
    await engine.setRowOrder(0, fillValues([1, 2, 0], 15))
    await engine.undo()
    expect(engine.isItPossibleToSetRowOrder(0, fillValues( [1, 2, 0], 16))).toEqual(true)
    await engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([['=SUM(#REF!)', 8, 9], ['=A3', '=SUM(B3:B4)', 3], ['=A11', '=SUM(B11:B16)', 6]])
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([[1]])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.setRowOrder(0, [0])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})
