import {ContentChanges} from './ContentChanges'
import {Vertex} from './DependencyGraph'

export interface Evaluator {
  run(): void,
  partialRun(vertices: Vertex[]): ContentChanges,
  destroy(): void
}
