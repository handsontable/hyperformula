import {EmptyValue, EmptyValueType} from '../Cell'

/**
 * Represents singleton vertex bound to all empty cells
 */
export class EmptyCellVertex {
  /**
   * Retrieves cell value bound to that singleton
   */
  public getCellValue(): EmptyValueType {
    return EmptyValue
  }
}
