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
* The event is triggered upon adding a sheet anywhere inside the workbook.
* 
* @event sheetAdded
* 
* @param {string} addedSheetDisplayName the name of added sheet
*/
export type SheetAddedHandler = (addedSheetDisplayName: string) => any

/**
* The event is triggered upon removing a sheet from anywhere inside the workbook.
* 
* @event sheetRemoved
* 
* @param {string} removedSheetDisplayName the name of removed sheet
* @param {ExportedChange[]} changes the values and location of applied changes
*/
export type SheetRemovedHandler = (removedSheetDisplayName: string, changes: ExportedChange[]) => any

/**
* The event is triggered upon renaming a sheet anywhere inside the workbook.
*  
* @event sheetRenamed
* 
* @param {string} oldDisplayName the old name of a sheet before renaming
* @param {string} newDisplayName the new name of the sheet after renaming 
*/
export type SheetRenamedHandler = (oldDisplayName: string, newDisplayName: string) => any

/**
* The event is triggered upon adding a named expression with specified values and location.
* 
* @event namedExpressionAdded
* 
* @param {string} namedExpressionName the name of added expression
* @param {ExportedChange[]} changes the values and location of applied changes
*/
export type NamedExpressionAddedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any

/**
* The event is triggered upon removing a named expression with specified values and from an indicated location.
* 
* @event namedExpressionRemoved
* 
* @param {string} namedExpressionName the name of removed expression
* @param {ExportedChange[]} changes the values and location of applied changes
*/
export type NamedExpressionRemovedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any

/**
* The event is triggered upon changing values in a specified location.
* 
* @event valuesUpdated
* 
* @param {ExportedChange[]} changes the values and location of applied changes
*/
export type ValuesUpdatedHandler = (changes: ExportedChange[]) => any
