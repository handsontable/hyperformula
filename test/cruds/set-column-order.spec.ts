import {HyperFormula} from '../../src'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'

describe('setting column order - checking if it is possible', () => {
  it('should validate numbers for negative columns', () => {
    const engine = HyperFormula.buildFromArray([[]])
    expect(() =>
      engine.setColumnOrder(0, [[-1, 0]])
    ).toThrowError('Invalid arguments, expected column numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources for noninteger values', () => {
    const engine = HyperFormula.buildFromArray([[]])
    expect(() =>
      engine.setColumnOrder(0, [[1, 1], [0.5, 0]])
    ).toThrowError('Invalid arguments, expected column numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources for values exceeding sheet width', () => {
    const engine = HyperFormula.buildFromArray([[0, 0, 0]])
    expect(() =>
      engine.setColumnOrder(0, [[1, 1], [3, 0]])
    ).toThrowError('Invalid arguments, expected column numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources to be unique', () => {
    const engine = HyperFormula.buildFromArray([[0, 0, 0]])
    expect(() =>
      engine.setColumnOrder(0, [[0, 0], [1, 1], [1, 2]])
    ).toThrowError('Invalid arguments, expected source column numbers to be unique.')
  })

  it('should validate sources to be permutation of targets', () => {
    const engine = HyperFormula.buildFromArray([[0, 0, 0]])
    expect(() =>
      engine.setColumnOrder(0, [[0, 0], [1, 1], [2, 1]])
    ).toThrowError('Invalid arguments, expected target column numbers to be permutation of source column numbers.')
  })

  it('should check for matrices', () => {
    const engine = HyperFormula.buildFromArray([[0, 0, '{=1}']])
    expect(() =>
      engine.setColumnOrder(0, [[0, 2], [1, 1], [2, 0]])
    ).toThrowError('Cannot perform this operation, source location has a matrix inside.')
  })

  it('should check for matrices only in moved rows', () => {
    const engine = HyperFormula.buildFromArray([[0, '{=1}', 0]])
    expect(() =>
      engine.setColumnOrder(0, [[0, 2], [1, 1], [2, 0]])
    ).not.toThrowError()
  })
})

describe('should correctly work', () => {
  it('should work on static engine', () => {
    const engine = HyperFormula.buildFromArray([[1, 'abcd'], [3, 3], [5, true]])
    engine.setColumnOrder(0, [[0, 1], [1, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([['abcd', 1], [3, 3], [true, 5]])
  })

  it('should return number of changed cells', () => {
    const engine = HyperFormula.buildFromArray([[1, 2], [3, 4], [5, 6]])
    const ret = engine.setColumnOrder(0, [[0, 1], [1, 0]])
    expect(ret.length).toEqual(6)
  })

  it('should work on static engine with uneven column', () => {
    const engine = HyperFormula.buildFromArray([[1, 2], [3, 4], [5]], {chooseAddressMappingPolicy: new AlwaysSparse()})
    engine.setColumnOrder(0, [[0, 1], [1, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[2, 1], [4, 3], [null, 5]])
  })

  it('should work with more complicated permutations', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2], [6, 4, 5], [9, 7, 8]])
  })

  it('should not move values unnecessarily', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6]])
    const ret = engine.setColumnOrder(0, [[0, 0], [1, 1]])
    expect(ret.length).toEqual(0)
  })

  it('should work with external references', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2, '=A1', '=SUM(A2:A3)'], [6, 4, 5], [9, 7, 8]])
    expect(engine.getSheetValues(0)).toEqual([[3, 1, 2, 3, 15], [6, 4, 5], [9, 7, 8]])
  })

  it('should work with internal references', () => {
    const engine = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
    engine.setColumnOrder(0, [[0, 1], [1, 2], [2, 0]])
    expect(engine.getSheetSerialized(0)).toEqual([[3, '=B2', '=SUM(C2:C3)'], ['=#REF!', 1, '=SUM(C10:C15)'], [9, '=SUM(E1:E10)', 8]])
  })
})

describe('reorder working with undo', () => {
  it('should work on static engine', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('should work with external references', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
  })

  it('should work with internal references', () => {
    const engine = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
    engine.setColumnOrder(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    expect(engine.getSheetSerialized(0)).toEqual([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
  })
})

describe('reorder working with redo', () => {
  it('should work on static engine', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2], [6, 4, 5], [9, 7, 8]])
  })

  it('should work with external references', () => {
    const engine = HyperFormula.buildFromArray([[1, 2, 3, '=A1', '=SUM(A2:A3)'], [4, 5, 6], [7, 8, 9]])
    engine.setColumnOrder(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[3, 1, 2, '=A1', '=SUM(A2:A3)'], [6, 4, 5], [9, 7, 8]])
    expect(engine.getSheetValues(0)).toEqual([[3, 1, 2, 3, 15], [6, 4, 5], [9, 7, 8]])
  })

  it('should work with internal references', () => {
    const engine = HyperFormula.buildFromArray([['=A2', '=SUM(B2:B3)', 3], [1, '=SUM(B10:B15)', '=A10'], ['=SUM(D1:D10)', 8, 9]])
    engine.setColumnOrder(0, [[0, 1], [1, 2], [2, 0]])
    engine.undo()
    engine.redo()
    expect(engine.getSheetSerialized(0)).toEqual([[3, '=B2', '=SUM(C2:C3)'], ['=#REF!', 1, '=SUM(C10:C15)'], [9, '=SUM(E1:E10)', 8]])
  })
})
