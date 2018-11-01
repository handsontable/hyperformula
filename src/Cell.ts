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


export const cellAddressFromString = (stringAddress: string, baseAddress: CellAddress): CellAddress => {
  const result = stringAddress.match(/(\$?)([A-Z]+)(\$?)([0-9]+)/)!

  let col
  if (result[2].length === 1) {
    col = result[2].charCodeAt(0) - 65
  } else {
    col = result[2].split("").reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.charCodeAt(0) - 64)
    }, 0) - 1;
  }

  const row = Number(result[4] as string) - 1
  if (result[1] === '$' && result[3] === '$') {
    return absoluteCellAddress(col, row)
  } else if (result[1] === '$') {
    return absoluteColCellAddress(col, row - baseAddress.row)
  } else if (result[3] === '$') {
    return absoluteRowCellAddress(col - baseAddress.col, row)
  } else {
    return relativeCellAddress(col - baseAddress.col, row - baseAddress.row)
  }
}

export const getAbsoluteDependency = (address: CellDependency, formulaAddress: CellAddress): CellDependency => {
  if (Array.isArray(address)) {
    return [getAbsoluteAddress(address[0], formulaAddress), getAbsoluteAddress(address[1], formulaAddress)] as [CellAddress, CellAddress]
  } else {
    return getAbsoluteAddress(address, formulaAddress)
  }
}

export const getAbsoluteAddress = (address: CellAddress, baseAddress: CellAddress): CellAddress => {
  if (address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE) {
    return address
  } else if (address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW) {
    return absoluteCellAddress(baseAddress.col + address.col, address.row)
  } else if (address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL) {
    return absoluteCellAddress(address.col, baseAddress.row + address.row)
  } else {
    return absoluteCellAddress(baseAddress.col + address.col, baseAddress.row + address.row)
  }
}
