import {CellValue, SimpleCellAddress, simpleCellAddress} from "../Cell";
import {DependencyGraph} from "../DependencyGraph";
import {AbsoluteCellRange} from "../AbsoluteCellRange";
import {add} from "./scalar";

class ColumnIndex {
  private readonly index: Array<Map<CellValue, Array<number>>>

  constructor(
      private width: number,
      private height: number,
      private sheet: number
  ) {
    this.index = new Array(width)
  }

  public buildIndex(values: IterableIterator<[CellValue, SimpleCellAddress]>) {
    for (let column = 0; column < this.width; ++column) {
      for (const [value, address] of values) {
        this.addToIndex(value, address)
      }
    }
  }

  public addToIndex(value: CellValue, address: SimpleCellAddress) {
    let columnMap = this.index[address.col]
    if (!columnMap) {
      columnMap = new Map()
      this.index[address.col] = columnMap
    }
    let valueIndex = columnMap.get(value)
    if (!valueIndex) {
      valueIndex = []
      columnMap.set(value, valueIndex)
    }
    valueIndex.push(address.row)
  }
}
