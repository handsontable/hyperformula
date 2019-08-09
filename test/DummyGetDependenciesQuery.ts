import {IGetDependenciesQuery} from '../src/DependencyGraph'

export class DummyGetDependenciesQuery<T> implements IGetDependenciesQuery<T> {
  public call(node: T): Set<T> {
    return new Set()
  }
}
