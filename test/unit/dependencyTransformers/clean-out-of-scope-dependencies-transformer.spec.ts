import { CleanOutOfScopeDependenciesTransformer } from '../../src/dependencyTransformers/CleanOutOfScopeDependenciesTransformer'

describe('CleanOutOfScopeDependenciesTransformer', () => {

  it('isIrreversible always returns true', () => {
    const transformer = new CleanOutOfScopeDependenciesTransformer(5)
    expect(transformer.isIrreversible()).toEqual(true)
  })

})
