import {Vertex} from './Vertex'

export interface Evaluator {
  run(): void,
  partialRun(vertex: Vertex): void,
}
