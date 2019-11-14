import {HyperFormula} from "../../src";
import '../testConfig'
import {normalizeIndexes} from "../../src/CrudOperations";
import {expect_array_with_same_content} from "../testUtils";

describe('batch cruds', () => {
  it('should run batch cruds and call recompute only once', () => {
    const engine = HyperFormula.buildFromArray([])

    const recomputeSpy = jest.spyOn(engine as any, 'recomputeIfDependencyGraphNeedsIt')

    engine.batch((e) => {
      e.addRows(0, [0, 1], [0, 1])
      e.removeRows(0, [0, 1], [0, 1])
    })

    expect(recomputeSpy).toBeCalledTimes(1)
  })
})

describe('normalize indexes', () => {
  it('should return empty array', () => {
    const normalized = normalizeIndexes([])
    expect_array_with_same_content(normalized, [])
  })

  it('should return unchanged one element array', () => {
    const normalized = normalizeIndexes([[3, 8]])
    expect_array_with_same_content(normalized, [[3, 8]])
  })

  it('should return unchanged when no overlapping indexes', () => {
    const normalized = normalizeIndexes([[3, 5], [9, 5]])
    expect_array_with_same_content(normalized, [[3, 5], [9, 5]])
  })

  it('should normalize adjacent indexes', () => {
    const normalized = normalizeIndexes([[3, 5], [8, 5]])
    expect_array_with_same_content(normalized, [[3, 10]])
  })

  it('should normalize overlapping indexes', () => {
    const normalized = normalizeIndexes([[3, 5], [5, 9]])
    expect_array_with_same_content(normalized, [[3, 11]])
  })

  it('should normalize unsorted indexes', () => {
    const normalized = normalizeIndexes([[5, 9], [3, 5]])
    expect_array_with_same_content(normalized, [[3, 11]])
  })
})
