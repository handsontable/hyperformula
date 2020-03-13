import {IGetDependenciesQuery} from '../src/DependencyGraph'

export class DummyGetDependenciesQuery<T> implements IGetDependenciesQuery<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public call(node: T): Set<T> {
    return new Set()
  }
}
