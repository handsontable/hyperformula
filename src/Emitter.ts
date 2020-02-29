import {ExportedChange} from './CellValue'

export enum Events {
  SheetAdded = 'sheetAdded',
  SheetRemoved = 'sheetRemoved',
  SheetRenamed = 'sheetRenamed',
}
export type SheetAddedHandler = (addedSheetDisplayName: string) => any
export type SheetRemovedHandler = (changes: ExportedChange[]) => any
export type SheetRenamedHandler = (oldDisplayName: string, newDisplayName: string) => any
