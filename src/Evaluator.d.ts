import {Vertex} from './DependencyGraph'

export interface Evaluator {
  run(): void,
  partialRun(vertices: Vertex[]): void,
}
