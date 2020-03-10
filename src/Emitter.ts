import { ExportedChange } from './CellValue'

export enum Events {
  SheetAdded = 'sheetAdded',
  SheetRemoved = 'sheetRemoved',
  SheetRenamed = 'sheetRenamed',
  NamedExpressionAdded = 'namedExpressionAdded',
  NamedExpressionRemoved = 'namedExpressionRemoved',
  ValuesUpdated = 'valuesUpdated',
}

/**
  * @event SheetAddedHandler
  * @param {string} addedSheetDisplayName
  */
export type SheetAddedHandler = (addedSheetDisplayName: string) => any

/**
  * @event SheetRemovedHandler
  * @param {string} removedSheetDisplayName
  * @param {ExportedChange[]} changes  
  */
export type SheetRemovedHandler = (removedSheetDisplayName: string, changes: ExportedChange[]) => any

/**
  * @event SheetRenamedHandler
  * @param {string} oldDisplayName
  * @param {string} newDisplayName  
  */
export type SheetRenamedHandler = (oldDisplayName: string, newDisplayName: string) => any

/**
  * @event NamedExpressionAddedHandler
  * @param {string} namedExpressionName
  * @param {ExportedChange[]} changes  
  */
export type NamedExpressionAddedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any

/**
  * @event NamedExpressionRemovedHandler
  * @param {string} namedExpressionName
  * @param {ExportedChange[]} changes
  */
export type NamedExpressionRemovedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any

/**
  * @event ValuesUpdatedHandler
  * @param {ExportedChange[]} changes
  */
export type ValuesUpdatedHandler = (changes: ExportedChange[]) => any
