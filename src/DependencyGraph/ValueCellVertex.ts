import {CellError} from '../Cell'

type ValueCellVertexValue = number | boolean | string | CellError

/**
 * Represents vertex which keeps static cell value
 */
export class ValueCellVertex {
  /** Static cell value. */
  private cellValue: ValueCellVertexValue

  constructor(cellValue: ValueCellVertexValue) {
    this.cellValue = cellValue
  }

  /**
   * Returns cell value stored in vertex
   */
  public getCellValue(): ValueCellVertexValue {
    return this.cellValue
  }

  /**
   * Sets computed cell value stored in this vertex
   */
  public setCellValue(cellValue: ValueCellVertexValue) {
    this.cellValue = cellValue
  }
}
