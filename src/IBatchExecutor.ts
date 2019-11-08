import {Index} from "./HyperFormula";

export interface IBatchExecutor {
  addRows: (sheet: number, ...indexes: Index[]) => void
  removeRows: (sheet: number, ...indexes: Index[]) => void
  addColumns: (sheet: number, ...indexes: Index[]) => void
  removeColumns: (sheet: number, ...indexes: Index[]) => void
}
