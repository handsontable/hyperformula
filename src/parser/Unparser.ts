import {Ast, AstNodeType} from "./index";
import {SimpleCellAddress} from "../Cell";
import {CellAddress, CellReferenceType} from "./CellAddress";

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
  return `${colDolar}${column}${rowDolar}${simpleAddress.row+1}`
}

export function unparse(ast: Ast, address: SimpleCellAddress, sheetMappingFn: SheetMappingFn): string {
  switch (ast.type) {
    case AstNodeType.NUMBER:
      return ast.value.toString()
    case AstNodeType.STRING:
      return ast.value
    case AstNodeType.FUNCTION_CALL:
      const result = ast.args.reduce(function (acc, val) {
        return acc + unparse(val, address, sheetMappingFn) + ","
      }, ast.procedureName + "(")
      return result.slice(0, result.length - 1) + ")"
    case AstNodeType.CELL_REFERENCE: {
      const sheet = sheetMappingFn(ast.reference.sheet)
      return "$" + sheet + "." + addressToString(ast.reference, address)
    }
    case AstNodeType.CELL_RANGE: {
      const sheet = sheetMappingFn(ast.start.sheet)
      return "$" + sheet + "." + addressToString(ast.start, address) + ":" + addressToString(ast.end, address)
    }
    case AstNodeType.MINUS_UNARY_OP:
      return "-" + unparse(ast.value, address, sheetMappingFn)
    case AstNodeType.ERROR:
      return "!ERR"
    default:
      if (binaryOpTokenMap.hasOwnProperty(ast.type)) {
        return unparse(ast.left, address, sheetMappingFn) + binaryOpTokenMap[ast.type] + unparse(ast.right, address, sheetMappingFn)
      } else {
        throw Error("Cannot unparse formula")
      }
  }
}
