import {Vertex} from './DependencyGraph'
import {ContentChanges} from "./ContentChanges";

export interface Evaluator {
  run(): void,
  partialRun(vertices: Vertex[]): ContentChanges,
  destroy(): void
}
