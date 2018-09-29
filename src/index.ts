import {GraphBuilder, Sheet} from "./GraphBuilder";
import {CellValue, FormulaCellVertex, Vertex} from "./Vertex";
import {Graph} from "./Graph";
import {Ast} from "./parser/parser";
import {AstNodeType} from "./AstNodeType";

export class HandsOnEngine {
  private addressMapping: Map<string, Vertex> = new Map()
  private graph: Graph<Vertex> = new Graph()

  loadSheet(sheet : Sheet) {
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

  computeFormula(formula : Ast) : CellValue {
    switch (formula.type) {
      case AstNodeType.RELATIVE_CELL:
        const address = formula.args[0]
        const vertex = this.addressMapping.get(address as string)!
        return vertex.getCellValue()
      case AstNodeType.PLUS_OP:
        const child1 = formula.args[0] as Ast
        const child2 = formula.args[1] as Ast
        const child1Result = this.computeFormula(child1) as string
        const child2Result = this.computeFormula(child2) as string
        return String(parseInt(child1Result) + parseInt(child2Result));
      case AstNodeType.NUMBER:
        const numberValue = parseInt(formula.args[0] as string)
        return String(numberValue)
      default:
        throw Error("Unsupported formula")
    }
  }

  getCellValue(address: string) : CellValue {
    const vertex = this.addressMapping.get(address)!
    return vertex.getCellValue()
  }
}
