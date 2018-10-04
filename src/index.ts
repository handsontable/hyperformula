import {GraphBuilder, Sheet} from "./GraphBuilder";
import {CellValue, FormulaCellVertex, Vertex, argError} from "./Vertex";
import {Graph} from "./Graph";
import {Ast, AstNodeType, NumberAst, PlusOpAst, MinusOpAst, TimesOpAst, RelativeCellAst} from "./parser/Ast";

export class HandsOnEngine {
  private addressMapping: Map<string, Vertex> = new Map()
  private graph: Graph<Vertex> = new Graph()

  loadSheet(sheet: Sheet) {
    const graphBuilder = new GraphBuilder(this.graph, this.addressMapping)
    graphBuilder.buildGraph(sheet)

    const vertices = this.graph.topologicalSort()

    vertices.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex) {
        const formula = vertex.getFormula()
        const cellValue = this.computeFormula(formula)
        vertex.setCellValue(cellValue)
      }
    })
  }

  computeFormula(formula: Ast): CellValue {
    switch (formula.type) {
      case AstNodeType.RELATIVE_CELL: {
        const address = formula.address
        const vertex = this.addressMapping.get(address)!
        return vertex.getCellValue()
      }
      case AstNodeType.NUMBER: {
        return formula.value
      }
      case AstNodeType.PLUS_OP: {
        const leftResult = this.computeFormula(formula.left)
        const rightResult = this.computeFormula(formula.right)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult + rightResult
        } else {
          return argError()
        }
      }
      case AstNodeType.MINUS_OP: {
        const leftResult = this.computeFormula(formula.left)
        const rightResult = this.computeFormula(formula.right)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult - rightResult
        } else {
          return argError()
        }
      }
      case AstNodeType.TIMES_OP: {
        const leftResult = this.computeFormula(formula.left)
        const rightResult = this.computeFormula(formula.right)
        if (typeof leftResult === 'number' && typeof rightResult === 'number') {
          return leftResult * rightResult
        } else {
          return argError()
        }
      }
    }
  }

  getCellValue(address: string): CellValue {
    const vertex = this.addressMapping.get(address)!
    return vertex.getCellValue()
  }
}
