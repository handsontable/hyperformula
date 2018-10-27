export enum ErrorType {
  ARG = "ARG",
  DIV_BY_ZERO = "DIV_BY_ZERO",
  NAME = "NAME"
}

export enum CellReferenceType {
  CELL_REFERENCE_RELATIVE = "CELL_REFERENCE",
  CELL_REFERENCE_ABSOLUTE = "CELL_REFERENCE_ABSOLUTE",
  CELL_REFERENCE_ABSOLUTE_COL = "CELL_REFERENCE_ABSOLUTE_COL",
  CELL_REFERENCE_ABSOLUTE_ROW = "CELL_REFERENCE_ABSOLUTE_ROW",
}

export interface CellError {
  type: ErrorType
}
export const cellError = (error: ErrorType): CellError => ({type: error})

export type CellValue = string | number | CellError

export type CellAddress = {
  col: number,
  row: number,
  type: CellReferenceType
}

export const relativeCellAddress = (col: number, row: number) : CellAddress=> ({ col, row, type: CellReferenceType.CELL_REFERENCE_RELATIVE })
export const absoluteCellAddress = (col: number, row: number) : CellAddress=> ({ col, row, type: CellReferenceType.CELL_REFERENCE_ABSOLUTE })
export const absoluteColCellAddress = (col: number, row: number) : CellAddress=> ({ col, row, type: CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL })
export const absoluteRowCellAddress = (col: number, row: number) : CellAddress=> ({ col, row, type: CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW })


export type CellDependency = CellAddress | [CellAddress, CellAddress]