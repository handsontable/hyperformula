import {SimpleCellAddress} from '../Cell'
import {cellAddressToString} from './addressRepresentationConverters'
import {Ast, AstNodeType} from './Ast'
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
        return withWhitespace(ast.value.toString(), ast.leadingWhitespace)
      }
      case AstNodeType.STRING: {
        return withWhitespace('"' + ast.value + '"', ast.leadingWhitespace)
      }
      case AstNodeType.FUNCTION_CALL: {
        const args = ast.args.map((arg) => this.unparseAst(arg, address)).join(this.config.functionArgSeparator)
        const procedureName = this.config.getFunctionTranslationFor(ast.procedureName) || ast.procedureName
        const rightPart = procedureName + '(' + args + withWhitespace(')', ast.internalWhitespace)
        return withWhitespace(rightPart, ast.leadingWhitespace)
      }
      case AstNodeType.CELL_REFERENCE: {
        let image
        if (ast.reference.sheet === address.sheet) {
          image = cellAddressToString(ast.reference, address)
        } else {
          image = this.unparseSheetName(ast.reference.sheet) + '!' + cellAddressToString(ast.reference, address)
        }
        return withWhitespace(image, ast.leadingWhitespace)
      }
      case AstNodeType.CELL_RANGE: {
        let image
        if (ast.start.sheet === address.sheet) {
          image = cellAddressToString(ast.start, address) + ':' + cellAddressToString(ast.end, address)
        } else {
          image = this.unparseSheetName(ast.start.sheet) + '!' + cellAddressToString(ast.start, address) + ':' + cellAddressToString(ast.end, address)
        }
        return withWhitespace(image, ast.leadingWhitespace)
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const unparsedExpr = this.unparseAst(ast.value, address)
        return withWhitespace('+', ast.leadingWhitespace) + unparsedExpr
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const unparsedExpr = this.unparseAst(ast.value, address)
        return withWhitespace('-', ast.leadingWhitespace) + unparsedExpr
      }
      case AstNodeType.PERCENT_OP: {
        return this.unparseAst(ast.value, address) + withWhitespace('%', ast.leadingWhitespace)
      }
      case AstNodeType.ERROR: {
        let image
        if (ast.error) {
          image = this.config.getErrorTranslationFor(ast.error.type)
        } else {
          image = '#ERR!'
        }
        return withWhitespace(image, ast.leadingWhitespace)
      }
      case AstNodeType.PARENTHESIS: {
        const expression = this.unparseAst(ast.expression, address)
        const rightPart = '(' + expression + withWhitespace(')', ast.internalWhitespace)
        return withWhitespace(rightPart, ast.leadingWhitespace)
      }
      default: {
        const left = this.unparseAst(ast.left, address)
        const right = this.unparseAst(ast.right, address)
        return left + withWhitespace(binaryOpTokenMap[ast.type], ast.leadingWhitespace) + right
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

export function withWhitespace(image: string, leadingWhitespace?: string) {
  return (leadingWhitespace ? leadingWhitespace : '') + image
}
