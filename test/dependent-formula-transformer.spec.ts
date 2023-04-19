import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {adr} from './testUtils'
import {DependentFormulaTransformer} from '../src/dependencyTransformers/MoveCellsTransformer'

describe('DependentFormulaTransformer', () => {
  it('basic functionality', () => {
    const sheetId = 99
    const sourceRange = AbsoluteCellRange.spanFrom(adr('A1', sheetId), 1, 1)
    const transformer = new DependentFormulaTransformer(sourceRange, 1, 1, 0)

    expect(transformer.sheet).toBe(sheetId)
    expect(transformer.isIrreversible()).toBe(true)
  })
})
