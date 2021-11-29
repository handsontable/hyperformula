import {HyperFormula} from '../../src'
import {normalizeAddedIndexes, normalizeRemovedIndexes} from '../../src/Operations'
import {adr, expectArrayWithSameContent} from '../testUtils'

describe('batch cruds', () => {
  it('should run batch cruds and call recompute only once', () => {
    const [engine] = HyperFormula.buildFromArray([
      //
      ['foo'],
      //
      ['bar'],
    ])

    const evaluatorSpy = spyOn(engine.evaluator, 'partialRun')

    engine.batch(() => {
      engine.setCellContents(adr('B1'), [['=A1']])
      engine.addRows(0, [0, 1], [1, 1])
      engine.removeRows(0, [0, 1])
    })

    expect(evaluatorSpy).toHaveBeenCalledTimes(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('A2'))).toBe(null)
    expect(engine.getCellValue(adr('A3'))).toEqual('bar')
  })

  it('should run batch cruds unitl fail and call recompute only once', () => {
    const [engine] = HyperFormula.buildFromArray([
      //
      ['foo'],
      //
      ['bar'],
    ])

    const evaluatorSpy = spyOn(engine.evaluator, 'partialRun')

    try {
      engine.batch(() => {
        engine.setCellContents(adr('B1'), [['=A1']])
        engine.addRows(0, [0, 1], [1, 1])
        engine.removeRows(0, [0, 1])
        engine.addRows(1, [0, 1]) // fail
        engine.addRows(0, [0, 1])
      })
    } catch (e) {
      // empty line
    }

    expect(evaluatorSpy).toHaveBeenCalledTimes(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('A2'))).toBe(null)
    expect(engine.getCellValue(adr('A3'))).toEqual('bar')
  })
})

describe('normalize added indexes', () => {
  it('should return empty array', () => {
    const normalized = normalizeAddedIndexes([])
    expectArrayWithSameContent(normalized, [])
  })

  it('should return unchanged one element array', () => {
    const normalized = normalizeAddedIndexes([[3, 8]])
    expectArrayWithSameContent(normalized, [[3, 8]])
  })

  it('should return shifted further indexes when expanding', () => {
    const normalized = normalizeAddedIndexes([[3, 3], [7, 3]])
    expectArrayWithSameContent(normalized, [[3, 3], [10, 3]])
  })

  it('should merge indexes with same start', () => {
    const normalized = normalizeAddedIndexes([[3, 3], [3, 7]])
    expectArrayWithSameContent(normalized, [[3, 7]])
  })

  it('should return shift further indexes - more arguments', () => {
    const normalized = normalizeAddedIndexes([[3, 3], [7, 3], [11, 2]])
    expectArrayWithSameContent(normalized, [[3, 3], [10, 3], [17, 2]])
  })

  it('should return shift further indexes even when they overlap', () => {
    const normalized = normalizeAddedIndexes([[3, 5], [8, 5]])
    expectArrayWithSameContent(normalized, [[3, 5], [13, 5]])
  })

  it('should normalize unsorted indexes', () => {
    const normalized = normalizeAddedIndexes([[5, 9], [3, 5]])
    expectArrayWithSameContent(normalized, [[3, 5], [10, 9]])
  })

  it('mixed case', () => {
    const normalized = normalizeAddedIndexes([[3, 7], [3, 2], [2, 1], [15, 15]])
    expectArrayWithSameContent(normalized, [[2, 1], [4, 7], [23, 15]])
  })
})

describe('normalize removed indexes', () => {
  it('should return empty array', () => {
    const normalized = normalizeRemovedIndexes([])
    expectArrayWithSameContent(normalized, [])
  })

  it('should return unchanged one element array', () => {
    const normalized = normalizeRemovedIndexes([[3, 8]])
    expectArrayWithSameContent(normalized, [[3, 8]])
  })

  it('should return shifted further indexes', () => {
    const normalized = normalizeRemovedIndexes([[3, 3], [7, 3]])
    expectArrayWithSameContent(normalized, [[3, 3], [4, 3]])
  })

  it('should return shift further indexes - more arguments', () => {
    const normalized = normalizeRemovedIndexes([[3, 3], [7, 3], [11, 2]])
    expectArrayWithSameContent(normalized, [[3, 3], [4, 3], [5, 2]])
  })

  it('should normalize adjacent indexes', () => {
    const normalized = normalizeRemovedIndexes([[3, 5], [8, 5]])
    expectArrayWithSameContent(normalized, [[3, 10]])
  })

  it('should normalize overlapping indexes', () => {
    const normalized = normalizeRemovedIndexes([[3, 5], [5, 9]])
    expectArrayWithSameContent(normalized, [[3, 11]])
  })

  it('should normalize unsorted indexes', () => {
    const normalized = normalizeRemovedIndexes([[5, 9], [3, 5]])
    expectArrayWithSameContent(normalized, [[3, 11]])
  })

  it('mixed case', () => {
    const normalized = normalizeRemovedIndexes([[3, 7], [4, 8], [1, 1], [15, 5]])
    expectArrayWithSameContent(normalized, [[1, 1], [2, 9], [5, 5]])
  })
})
