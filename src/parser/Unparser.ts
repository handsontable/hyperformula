
import {SimpleCellAddress} from '../Cell'
import {cellAddressToString} from './addressRepresentationConverters'
import {Ast, AstNodeType, AstWithWhitespace} from './Ast'
import {binaryOpTokenMap} from './binaryOpTokenMap'
import {additionalCharactersAllowedInQuotes, ILexerConfig} from './LexerConfig'
import {ParserConfig} from './ParserConfig'

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
        return ast.value.toString() + (ast.trailingWhitespace ? ast.trailingWhitespace : "")
      }
      case AstNodeType.STRING: {
        return '"' + ast.value + '"'
      }
      case AstNodeType.FUNCTION_CALL: {
        const args = ast.args.map((arg) => this.unparseAst(arg, address)).join(this.config.functionArgSeparator)
        const procedureName = this.config.getFunctionTranslationFor(ast.procedureName)
        return (procedureName || ast.procedureName) + '(' + (ast.leadingWhitespace ? ast.leadingWhitespace : "") + args + ')' + (ast.trailingWhitespace ? ast.trailingWhitespace : "")
      }
      case AstNodeType.CELL_REFERENCE: {
        if (ast.reference.sheet === address.sheet) {
          return cellAddressToString(ast.reference, address)
        } else {
          return this.unparseSheetName(ast.reference.sheet) + '!' + cellAddressToString(ast.reference, address)
        }
      }
      case AstNodeType.CELL_RANGE: {
        if (ast.start.sheet === address.sheet) {
          return cellAddressToString(ast.start, address) + ':' + cellAddressToString(ast.end, address)
        } else {
          return this.unparseSheetName(ast.start.sheet) + '!' + cellAddressToString(ast.start, address) + ':' + cellAddressToString(ast.end, address)
        }
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const unparsedExpr = this.unparseAst(ast.value, address)
        return '+' + unparsedExpr
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const unparsedExpr = this.unparseAst(ast.value, address)
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
        const left = this.unparseAst(ast.left, address)
        const right = this.unparseAst(ast.right, address)
        return left + binaryOpTokenMap[ast.type] + right
      }
    }
  }

  private unparseSheetName(sheetId: number): string {
    const sheet = this.sheetMappingFn(sheetId)
    if (sheet.match(new RegExp(additionalCharactersAllowedInQuotes))) {
      return `'${sheet}'`
    } else {
      return sheet
    }
  }
}
