import {GraphBuilder, Sheet} from "./GraphBuilder";
import {CellValue, FormulaCellVertex, Vertex} from "./Vertex";
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
    switch (formula.kind) {
      case AstNodeType.RELATIVE_CELL: {
        const address = formula.address
        const vertex = this.addressMapping.get(address)!
        return vertex.getCellValue()
      }
      case AstNodeType.NUMBER: {
        const numberValue = formula.value
        return String(numberValue)
      }
      case AstNodeType.PLUS_OP: {
        const child1Result = this.computeFormula(formula.left) as string
        const child2Result = this.computeFormula(formula.right) as string
        return String(parseInt(child1Result) + parseInt(child2Result));
      }
      case AstNodeType.MINUS_OP: {
        const child1Result = this.computeFormula(formula.left) as string
        const child2Result = this.computeFormula(formula.right) as string
        return String(parseInt(child1Result) - parseInt(child2Result));
      }
      case AstNodeType.TIMES_OP: {
        const child1Result = this.computeFormula(formula.left) as string
        const child2Result = this.computeFormula(formula.right) as string
        return String(parseInt(child1Result) * parseInt(child2Result));
      }
    }
  }

  getCellValue(address: string): CellValue {
    const vertex = this.addressMapping.get(address)!
    return vertex.getCellValue()
  }
}
