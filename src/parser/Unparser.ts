import {Ast, AstNodeType} from "./index";
import {SimpleCellAddress} from "../Cell";
import {CellAddress, CellReferenceType} from "./CellAddress";
import {Config} from "../Config";
import {cellHashFromToken} from "./ParserWithCaching";

export type SheetMappingFn = (sheetId: number) => string

const binaryOpTokenMap = {
  [AstNodeType.PLUS_OP]: "+",
  [AstNodeType.MINUS_OP]: "-",
  [AstNodeType.TIMES_OP]: "*",
  [AstNodeType.DIV_OP]: "/",
  [AstNodeType.CONCATENATE_OP]: "&",
  [AstNodeType.POWER_OP]: "^",
  [AstNodeType.EQUALS_OP]: "=",
  [AstNodeType.NOT_EQUAL_OP]: "<>",
  [AstNodeType.GREATER_THAN_OP]: ">",
  [AstNodeType.GREATER_THAN_OR_EQUAL_OP]: ">=",
  [AstNodeType.LESS_THAN_OP]: "<",
  [AstNodeType.LESS_THAN_OR_EQUAL_OP]: "<=",
}

export class Unparser {
  constructor(
      private readonly config: Config,
      private readonly sheetMappingFn: SheetMappingFn
  ) {
  }

  public unparse(ast: Ast, address: SimpleCellAddress): string {
    switch (ast.type) {
      case AstNodeType.NUMBER: {
        return ast.value.toString()
      }
      case AstNodeType.STRING: {
        return "\"" + ast.value + "\""
      }
      case AstNodeType.FUNCTION_CALL: {
        const that = this
        const result = ast.args.reduce(function (acc, val) {
          return acc + that.unparse(val, address) + that.config.functionArgSeparator
        }, ast.procedureName + "(")
        return result.slice(0, result.length - 1) + ")"
      }
      case AstNodeType.CELL_REFERENCE: {
        const sheet = this.sheetMappingFn(ast.reference.sheet)
        return "$" + sheet + "." + addressToString(ast.reference, address)
      }
      case AstNodeType.CELL_RANGE: {
        const sheet = this.sheetMappingFn(ast.start.sheet)
        return "$" + sheet + "." + addressToString(ast.start, address) + ":" + addressToString(ast.end, address)
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return "-" + this.unparse(ast.value, address)
      }
      case AstNodeType.ERROR: {
        return "!ERR"
      }
      default: {
        if (binaryOpTokenMap.hasOwnProperty(ast.type)) {
          return this.unparse(ast.left, address) + binaryOpTokenMap[ast.type] + this.unparse(ast.right, address)
        } else {
          throw Error("Cannot unparse formula")
        }
      }
    }
  }

  public computeHash(ast: Ast): string {
    return "=" + this.doHash(ast)
  }

  private doHash(ast: Ast): string {
    switch (ast.type) {
      case AstNodeType.NUMBER: {
        return ast.value.toString()
      }
      case AstNodeType.STRING: {
        return "\"" + ast.value + "\""
      }
      case AstNodeType.FUNCTION_CALL: {
        const that = this
        const result = ast.args.reduce(function (acc, val) {
          return acc + that.doHash(val) + that.config.functionArgSeparator
        }, ast.procedureName + "(")
        return result.slice(0, result.length - 1) + ")"
      }
      case AstNodeType.CELL_REFERENCE: {
        return cellHashFromToken(ast.reference)
      }
      case AstNodeType.CELL_RANGE: {
        const start = cellHashFromToken(ast.start)
        const end = cellHashFromToken(ast.end)
        return start + ":" + end
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return "-" + this.doHash(ast.value)
      }
      case AstNodeType.ERROR: {
        return "!ERR"
      }
      default: {
        if (binaryOpTokenMap.hasOwnProperty(ast.type)) {
          return this.doHash(ast.left) + binaryOpTokenMap[ast.type] + this.doHash(ast.right)
        } else {
          throw Error("Cannot unparse formula")
        }
      }
    }
  }
}


export function columnIndexToLabel(column: number) {
  let result = '';

  while (column >= 0) {
    result = String.fromCharCode((column % 26) + 97) + result;
    column = Math.floor(column / 26) - 1;
  }

  return result.toUpperCase();
}

export function addressToString(address: CellAddress, baseAddress: SimpleCellAddress): string {
  const simpleAddress = address.toSimpleCellAddress(baseAddress)
  const column = columnIndexToLabel(simpleAddress.col)
  const rowDolar = address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW ? "$" : ''
  const colDolar = address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL ? "$" : ''
  return `${colDolar}${column}${rowDolar}${simpleAddress.row + 1}`
}
