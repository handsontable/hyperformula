import {SimpleCellAddress} from './Cell'
import {CellVertex, RangeVertex} from './Vertex'

export interface IAddressMapping {
  getCell(address: SimpleCellAddress): CellVertex,
  setCell(address: SimpleCellAddress, newVertex: CellVertex): void,
  getRange(start: SimpleCellAddress, end: SimpleCellAddress): void,
  setRange(vertex: RangeVertex): void,
  has(address: SimpleCellAddress): boolean,
  getMaximumRow(): number,
  getMaximumCol(): number,
}
