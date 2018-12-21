import {SimpleCellAddress} from './Cell'
import {CellVertex, RangeVertex} from './Vertex'

export interface IAddressMapping {
  getCell(address: SimpleCellAddress): CellVertex,
  setCell(address: SimpleCellAddress, newVertex: CellVertex): void,
  has(address: SimpleCellAddress): boolean,
  getHeight(): number,
  getWidth(): number,
}
