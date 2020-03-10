import { ExportedChange } from './CellValue'

export enum Events {
  /**
   * @event Events#SheetAdded
   */
  SheetAdded = 'sheetAdded',
  /**
 * @event Events#SheetRemoved
 */
  SheetRemoved = 'sheetRemoved',
  /**
 * @event Events#SheetRenamed
 */
  SheetRenamed = 'sheetRenamed',
  /**
 * @event Events#NamedExpressionAdded
 */
  NamedExpressionAdded = 'namedExpressionAdded',
  /**
 * @event Events#NamedExpressionRemoved
 */
  NamedExpressionRemoved = 'namedExpressionRemoved',
  /**
 * @event Events#ValuesUpdated
 */
  ValuesUpdated = 'valuesUpdated',
}
export type SheetAddedHandler = (addedSheetDisplayName: string) => any
export type SheetRemovedHandler = (removedSheetDisplayName: string, changes: ExportedChange[]) => any
export type SheetRenamedHandler = (oldDisplayName: string, newDisplayName: string) => any
export type NamedExpressionAddedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any
export type NamedExpressionRemovedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any
export type ValuesUpdatedHandler = (changes: ExportedChange[]) => any
