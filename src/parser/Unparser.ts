import {SimpleCellAddress} from '../Cell'
import assert from 'assert'
import {Ast, AstNodeType} from './Ast'
import {binaryOpTokenMap} from './binaryOpTokenMap'
import {ParserConfig} from './ParserConfig'
import {cellAddressToString} from "./addressRepresentationConverters";
import {ILexerConfig} from './LexerConfig'

export type SheetMappingFn = (sheetId: number) => string

const operatorPrecedence: Record<string, number> = {}
operatorPrecedence[AstNodeType.MINUS_UNARY_OP] = 900;
operatorPrecedence[AstNodeType.POWER_OP] = 800;
operatorPrecedence[AstNodeType.TIMES_OP] = 700;
operatorPrecedence[AstNodeType.DIV_OP] = 700;
operatorPrecedence[AstNodeType.PLUS_OP] = 600;
operatorPrecedence[AstNodeType.MINUS_OP] = 600;
operatorPrecedence[AstNodeType.CONCATENATE_OP] = 500;
operatorPrecedence[AstNodeType.EQUALS_OP] = 400;
operatorPrecedence[AstNodeType.NOT_EQUAL_OP] = 400;
operatorPrecedence[AstNodeType.GREATER_THAN_OP] = 400;
operatorPrecedence[AstNodeType.LESS_THAN_OP] = 400;
operatorPrecedence[AstNodeType.GREATER_THAN_OR_EQUAL_OP] = 400;
operatorPrecedence[AstNodeType.LESS_THAN_OR_EQUAL_OP] = 400

const isOperatorStrongerThan = (op1: AstNodeType, op2: AstNodeType): boolean => {
  const idx1 = operatorPrecedence[op1]
  const idx2 = operatorPrecedence[op2]
  assert.ok(idx1 !== undefined, "Operator not included in precedence rules")
  return idx1 > idx2
}

export class Unparser {
  constructor(
    private readonly config: ParserConfig,
    private readonly lexerConfig: ILexerConfig,
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
          return cellAddressToString(ast.reference, address)
        } else {
          const sheet = this.sheetMappingFn(ast.reference.sheet)
          return '$' + sheet + '.' + cellAddressToString(ast.reference, address)
        }
      }
      case AstNodeType.CELL_RANGE: {
        if (ast.start.sheet === address.sheet) {
          return cellAddressToString(ast.start, address) + ':' + cellAddressToString(ast.end, address)
        } else {
          const sheet = this.sheetMappingFn(ast.start.sheet)
          return '$' + sheet + '.' + cellAddressToString(ast.start, address) + ':' + cellAddressToString(ast.end, address)
        }
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return '-' + this.unparseAst(ast.value, address)
      }
      case AstNodeType.ERROR: {
        if (ast.error) {
          return this.config.getErrorTranslationFor(ast.error.type)
        } else {
          return '#ERR!'
        }
      }
      default: {
        let left = this.unparseAst(ast.left, address)
        if (isOperatorStrongerThan(ast.type, ast.left.type) === true) {
          left = '(' + left + ')'
        }
        let right = this.unparseAst(ast.right, address)
        if (isOperatorStrongerThan(ast.type, ast.right.type) === true) {
          right = '(' + right + ')'
        }
        return left + binaryOpTokenMap[ast.type] + right
      }
    }
  }
}
