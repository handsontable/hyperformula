import {SimpleCellAddress} from '../Cell'
import {ParserConfig} from './ParserConfig'
import {binaryOpTokenMap} from './binaryOpTokenMap'
import {CellAddress, CellReferenceType} from './CellAddress'
import {Ast, AstNodeType} from './index'

export type SheetMappingFn = (sheetId: number) => string

export class Unparser {
  constructor(
      private readonly config: ParserConfig,
      private readonly sheetMappingFn: SheetMappingFn,
  ) {
  }

  public unparse(ast: Ast, address: SimpleCellAddress): string {
    return '=' + this.unparseAst(ast, address)
  }

  private unparseAst(ast: Ast, address: SimpleCellAddress): string {
    switch (ast.type) {
      case AstNodeType.NUMBER: {
        return ast.value.toString()
      }
      case AstNodeType.STRING: {
        return '"' + ast.value + '"'
      }
      case AstNodeType.FUNCTION_CALL: {
        const args = ast.args.map((arg) => this.unparseAst(arg, address)).join(this.config.functionArgSeparator)
        return ast.procedureName + '(' + args + ')'
      }
      case AstNodeType.CELL_REFERENCE: {
        if (ast.reference.sheet === address.sheet) {
          return addressToString(ast.reference, address)
        } else {
          const sheet = this.sheetMappingFn(ast.reference.sheet)
          return '$' + sheet + '.' + addressToString(ast.reference, address)
        }
      }
      case AstNodeType.CELL_RANGE: {
        if (ast.start.sheet === address.sheet) {
          return addressToString(ast.start, address) + ':' + addressToString(ast.end, address)
        } else {
          const sheet = this.sheetMappingFn(ast.start.sheet)
          return '$' + sheet + '.' + addressToString(ast.start, address) + ':' + addressToString(ast.end, address)
        }
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return '-' + this.unparseAst(ast.value, address)
      }
      case AstNodeType.ERROR: {
        if (ast.error) {
          return `#${ast.error.type}!`
        } else {
          return '#ERR!'
        }
      }
      default: {
        return this.unparseAst(ast.left, address) + binaryOpTokenMap[ast.type] + this.unparseAst(ast.right, address)
      }
    }
  }
}

export function columnIndexToLabel(column: number) {
  let result = ''

  while (column >= 0) {
    result = String.fromCharCode((column % 26) + 97) + result
    column = Math.floor(column / 26) - 1
  }

  return result.toUpperCase()
}

export function addressToString(address: CellAddress, baseAddress: SimpleCellAddress): string {
  const simpleAddress = address.toSimpleCellAddress(baseAddress)
  const column = columnIndexToLabel(simpleAddress.col)
  const rowDolar = address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW ? '$' : ''
  const colDolar = address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL ? '$' : ''
  return `${colDolar}${column}${rowDolar}${simpleAddress.row + 1}`
}
