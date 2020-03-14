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
* Adding sheet event.
* 
* @event sheetAdded
* 
* @param {string} addedSheetDisplayName the name of added sheet
*/
export type SheetAddedHandler = (addedSheetDisplayName: string) => any

/**
* Removing sheet event. 
* 
* @event sheetRemoved
* 
* @param {string} removedSheetDisplayName the name of removed sheet
* @param {ExportedChange[]} changes the values and location of applied changes
*/
export type SheetRemovedHandler = (removedSheetDisplayName: string, changes: ExportedChange[]) => any

/**
* Renaming sheet event.
*  
* @event sheetRenamed
* 
* @param {string} oldDisplayName the old name of a sheet before renaming
* @param {string} newDisplayName the new name of the sheet after renaming 
*/
export type SheetRenamedHandler = (oldDisplayName: string, newDisplayName: string) => any

/**
* Adding named expression event.
* 
* @event namedExpressionAdded
* 
* @param {string} namedExpressionName the name of added expression
* @param {ExportedChange[]} changes the values and location of applied changes
*/
export type NamedExpressionAddedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any

/**
* Removing named expression event.
* 
* @event namedExpressionRemoved
* 
* @param {string} namedExpressionName the name of removed expression
* @param {ExportedChange[]} changes the values and location of applied changes
*/
export type NamedExpressionRemovedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any

/**
* Updated values event.
* 
* @event valuesUpdated
* 
* @param {ExportedChange[]} changes the values and location of applied changes
*/
export type ValuesUpdatedHandler = (changes: ExportedChange[]) => any
