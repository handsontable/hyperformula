import {Vertex} from './DependencyGraph'
import {ContentUpdate} from "./ContentUpdate";

export interface Evaluator {
  run(): void,
  partialRun(vertices: Vertex[]): ContentUpdate,
}
