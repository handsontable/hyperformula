import {ExportedChange} from './CellValue'

export enum Events {
  SheetAdded = 'sheetAdded',
  SheetRemoved = 'sheetRemoved',
  SheetRenamed = 'sheetRenamed',
  NamedExpressionAdded = 'namedExpressionAdded',
  NamedExpressionRemoved = 'namedExpressionRemoved',
}
export type SheetAddedHandler = (addedSheetDisplayName: string) => any
export type SheetRemovedHandler = (changes: ExportedChange[]) => any
export type SheetRenamedHandler = (oldDisplayName: string, newDisplayName: string) => any
export type NamedExpressionAddedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any
export type NamedExpressionRemovedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any
