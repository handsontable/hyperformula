export type SheetAddedHandler = (addedSheetDisplayName: string) => any
export type SheetRemovedHandler = (changes: ExportedChange[]) => any
export type SheetRenamedHandler = (oldDisplayName: string, newDisplayName: string) => any
