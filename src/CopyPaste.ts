import {AbsoluteCellRange} from './AbsoluteCellRange'
import {CellValue, EmptyValue, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellVertex, DependencyGraph, FormulaCellVertex, ValueCellVertex} from './DependencyGraph'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Ast} from './parser'

type ClipboardCell = CellValue | Ast

class CopyPasteClipboard {
  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly content: ClipboardCell[][]
  ) {
  }
}

export class CopyPaste {
  private clipboard?: CopyPasteClipboard

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService
  ) {
  }

  public copy(leftCorner: SimpleCellAddress, width: number, height: number): void {
    const copiedRange = AbsoluteCellRange.spanFrom(leftCorner, width, height)
    const content: ClipboardCell[][] = []

    for (let y=0; y< height; ++y) {
      content[y] = new Array(width)

      for (let x=0; x<width; ++x) {
        const clipboardCell = this.getClipboardCell(this.dependencyGraph.getCell(simpleCellAddress(leftCorner.sheet, leftCorner.col + x, leftCorner.row + y)))
        content[y].push(clipboardCell)
      }
    }
  }

  private getClipboardCell(vertex: CellVertex | null): ClipboardCell {
    if (vertex === null) {
      return EmptyValue
    }
    if (vertex instanceof ValueCellVertex) {
      return vertex.getCellValue()
    }
    if (vertex instanceof FormulaCellVertex) {
      return copyAst(vertex.getFormula(this.lazilyTransformingAstService))
    }

    throw Error("Trying to copy unsupported type")
  }

  public paste() {

  }
}

export function copyAst(ast: Ast): Ast {
  switch (ast.type) {
    case AstNodeType.CELL_REFERENCE:
    case AstNodeType.CELL_RANGE:
    case AstNodeType.ERROR:
    case AstNodeType.NUMBER:
    case AstNodeType.STRING: {
      return { ...ast }
    }
    case AstNodeType.PERCENT_OP:
    case AstNodeType.MINUS_UNARY_OP:
    case AstNodeType.PLUS_UNARY_OP: {
      return {
        type: ast.type,
        value: copyAst(ast.value)
      } as Ast
    }
    case AstNodeType.FUNCTION_CALL: {
      return {
        type: ast.type,
        procedureName: ast.procedureName,
        args: ast.args.map((arg) => copyAst(arg)),
      }
    }
    case AstNodeType.PARENTHESIS: {
      return {
        type: ast.type,
        expression: copyAst(ast.expression)
      }
    }
    default: {
      return {
        type: ast.type,
        left: copyAst(ast.left),
        right: copyAst(ast.right)
      } as Ast
    }
  }
}
