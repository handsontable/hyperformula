import {Index} from "./HyperFormula";
import {SimpleCellAddress} from "./Cell";
import {ContentChanges} from "./ContentChanges";

export interface IBatchExecutor {
  addRows: (sheet: number, ...indexes: Index[]) => void
  removeRows: (sheet: number, ...indexes: Index[]) => void
  addColumns: (sheet: number, ...indexes: Index[]) => void
  removeColumns: (sheet: number, ...indexes: Index[]) => void
  moveCells: (sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress) => void
}

