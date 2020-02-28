import {ContentChanges} from './ContentChanges'
import {InternalCellValue, SimpleCellAddress} from './Cell'
import {Ast} from './parser'
import {Vertex} from './DependencyGraph'

export interface Evaluator {
  run(): void,
  partialRun(vertices: Vertex[]): ContentChanges,
  runAndForget(ast: Ast, address: SimpleCellAddress): InternalCellValue,
  destroy(): void,
}
