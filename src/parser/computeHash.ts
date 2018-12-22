import {IToken, tokenMatcher} from 'chevrotain'
import {CellAddress, cellAddressFromString, CellReferenceType, SimpleCellAddress} from '../Cell'
import {CellReference, RangeSeparator, RelativeCell} from './FormulaParser'

export const computeHash = (tokens: IToken[], baseAddress: SimpleCellAddress): string => {
  let hash = ''
  let idx = 0
  while (idx < tokens.length) {
    const token = tokens[idx]
    if (tokenMatcher(token, CellReference)) {
      const cellAddress = cellAddressFromString(token.image, baseAddress)
      hash = hash.concat(cellHashFromToken(cellAddress))
      idx++
    } else {
      hash = hash.concat(token.image)
      idx++
    }
  }
  return hash
}

const cellHashFromToken = (cellAddress: CellAddress): string => {
  switch (cellAddress.type) {
    case CellReferenceType.CELL_REFERENCE_RELATIVE: {
      return `#${cellAddress.row}R${cellAddress.col}`
    }
    case CellReferenceType.CELL_REFERENCE_ABSOLUTE: {
      return `#${cellAddress.row}A${cellAddress.col}`
    }
    case CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL: {
      return `#${cellAddress.row}AC${cellAddress.col}`
    }
    case CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW: {
      return `#${cellAddress.row}AR${cellAddress.col}`
    }
  }
}
