import {SimpleCellAddress} from '../Cell'
import assert from 'assert'
import {Ast, AstNodeType} from './Ast'
import {binaryOpTokenMap} from './binaryOpTokenMap'
import {ParserConfig} from './ParserConfig'
import {cellAddressToString} from "./addressRepresentationConverters";
import {ILexerConfig} from './LexerConfig'

export type SheetMappingFn = (sheetId: number) => string

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
        const procedureName = this.config.getFunctionTranslationFor(ast.procedureName)
        return procedureName + '(' + args + ')'
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
        let unparsedExpr = this.unparseAst(ast.value, address)
        return '-' + unparsedExpr
      }
      case AstNodeType.PERCENT_OP: {
        return this.unparseAst(ast.value, address) + '%'
      }
      case AstNodeType.ERROR: {
        if (ast.error) {
          return this.config.getErrorTranslationFor(ast.error.type)
        } else {
          return '#ERR!'
        }
      }
      case AstNodeType.PARENTHESIS: {
        const expression = this.unparseAst(ast.expression, address)
        return '(' + expression + ')'
      }
      default: {
        let left = this.unparseAst(ast.left, address)
        let right = this.unparseAst(ast.right, address)
        return left + binaryOpTokenMap[ast.type] + right
      }
    }
  }
}
