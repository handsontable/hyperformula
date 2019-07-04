import {Vertex} from './Vertex'

export interface Evaluator {
  run(): void,
  partialRun(vertices: Vertex[]): void,
}
