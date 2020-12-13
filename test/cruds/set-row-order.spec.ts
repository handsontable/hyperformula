import {HyperFormula} from '../../src'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'

describe('setting row order - checking if it is possible', () => {
  it('should validate numbers for negative rows', () => {
    const engine = HyperFormula.buildFromArray([[]])
    expect(() =>
      engine.setRowOrder(0, [[-1,0]])
    ).toThrowError('Invalid arguments, expected row numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources for noninteger values', () => {
    const engine = HyperFormula.buildFromArray([[]])
    expect(() =>
      engine.setRowOrder(0, [[1,1],[0.5,0]])
    ).toThrowError('Invalid arguments, expected row numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources for values exceeding sheet height', () => {
    const engine = HyperFormula.buildFromArray([[0], [0], [0]])
    expect(() =>
      engine.setRowOrder(0, [[1,1],[3,0]])
    ).toThrowError('Invalid arguments, expected row numbers to be nonnegative integers and less than sheet height.')
  })

  it('should validate sources to be unique', () => {
    const engine = HyperFormula.buildFromArray([[0], [0], [0]])
    expect(() =>
      engine.setRowOrder(0, [[0,0], [1,1], [1,2]])
    ).toThrowError('Invalid arguments, expected source row numbers to be unique.')
  })

  it('should validate sources to be permutation of targets', () => {
    const engine = HyperFormula.buildFromArray([[0], [0], [0]])
    expect(() =>
      engine.setRowOrder(0, [[0,0], [1,1], [2,1]])
    ).toThrowError('Invalid arguments, expected target row numbers to be permutation of source row numbers.')
  })
})

describe('should correctly work', () => {
  it('should work on static engine', () => {
    const engine = HyperFormula.buildFromArray([[1,'abcd',3], [3,5,true]])
    engine.setRowOrder(0, [[0,1],[1,0]])
    expect(engine.getSheetSerialized(0)).toEqual([[3,5,true],[1,'abcd',3]])
  })

  it('should return number of changed cells', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3], [4,5,6]])
    const ret = engine.setRowOrder(0, [[0,1],[1,0]])
    expect(ret.length).toEqual(6)
  })

  it('should work on static engine with uneven rows', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3], [4,5,6,7,8]], {chooseAddressMappingPolicy: new AlwaysSparse()})
    engine.setRowOrder(0, [[0,1],[1,0]])
    expect(engine.getSheetSerialized(0)).toEqual([[4,5,6,7,8],[1,2,3]])
  })

  it('should work with more complicated permutations', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3], [4,5,6], [7,8,9]])
    engine.setRowOrder(0, [[0,1],[1,2],[2,0]])
    expect(engine.getSheetSerialized(0)).toEqual([[7,8,9], [1,2,3], [4,5,6]])
  })

  it('should not move values unnecessarily', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3], [4,5,6]])
    const ret = engine.setRowOrder(0, [[0,0],[1,1]])
    expect(ret.length).toEqual(0)
  })

  it('should work with external references', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3], [4,5,6], [7,8,9], ['=A1', '=SUM(A2:A3)']])
    engine.setRowOrder(0, [[0,1],[1,2],[2,0]])
    expect(engine.getSheetSerialized(0)).toEqual([[7,8,9], [1,2,3], [4,5,6], ['=A1', '=SUM(A2:A3)']])
    expect(engine.getSheetValues(0)).toEqual([[7,8,9], [1,2,3], [4,5,6], [7, 5]])
  })

  it('should work with internal references', () => {
    const engine = HyperFormula.buildFromArray([['=A2','=B2:B3',3], ['=A10','=B10:B15',6], ['=C1:C10',8,9]])
    engine.setRowOrder(0, [[0,1],[1,2],[2,0]])
    expect(engine.getSheetSerialized(0)).toEqual([['=C-1:C8',8,9], ['=A3','=B3:B4',3], ['=A11','=B11:B16',6]])
  })
})
