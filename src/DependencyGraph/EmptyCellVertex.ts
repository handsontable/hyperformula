import {EmptyValue, EmptyValueType} from '../Cell'

/**
 * Represents singleton vertex bound to all empty cells
 */
export class EmptyCellVertex {

  /**
   * Retrieves singleton
   */
  public static getSingletonInstance() {
    if (!EmptyCellVertex.instance) {
      EmptyCellVertex.instance = new EmptyCellVertex()
    }
    return EmptyCellVertex.instance
  }

  /** Singleton instance. */
  private static instance: EmptyCellVertex

  /**
   * Retrieves cell value bound to that singleton
   */
  public getCellValue(): EmptyValueType {
    return EmptyValue
  }
}
