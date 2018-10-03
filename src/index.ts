import {GraphBuilder, Sheet} from "./GraphBuilder";
import {CellValue, FormulaCellVertex, Vertex} from "./Vertex";
import {Graph} from "./Graph";
import {Ast, NumberAst, PlusOpAst, RelativeCellAst} from "./parser/Ast";

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
    if (formula instanceof RelativeCellAst) {
      const address = formula.getAddress()
      const vertex = this.addressMapping.get(address)!
      return vertex.getCellValue()
    } else if (formula instanceof PlusOpAst) {
        const child1 = formula.left()
        const child2 = formula.right()
        const child1Result = this.computeFormula(child1) as string
        const child2Result = this.computeFormula(child2) as string
        return String(parseInt(child1Result) + parseInt(child2Result));
    } else if (formula instanceof NumberAst) {
      const numberValue = formula.getValue()
      return String(numberValue)
    } else {
      throw Error("Unsupported formula")
    }
  }

  getCellValue(address: string): CellValue {
    const vertex = this.addressMapping.get(address)!
    return vertex.getCellValue()
  }
}
