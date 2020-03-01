import {ExportedChange} from './CellValue'

export enum Events {
  SheetAdded = 'sheetAdded',
  SheetRemoved = 'sheetRemoved',
  SheetRenamed = 'sheetRenamed',
  NamedExpressionAdded = 'namedExpressionAdded',
}
export type SheetAddedHandler = (addedSheetDisplayName: string) => any
export type SheetRemovedHandler = (changes: ExportedChange[]) => any
export type SheetRenamedHandler = (oldDisplayName: string, newDisplayName: string) => any
export type NamedExpressionAddedHandler = (namedExpressionName: string, changes: ExportedChange[]) => any
