import {GraphBuilder, Sheet} from "./GraphBuilder";
import {CellValue, FormulaCellVertex, ValueCellVertex, Vertex} from "./Vertex";
import {Graph} from "./Graph";
import {isFormula} from './parser/ParserWithCaching'
import {Interpreter} from "./interpreter/Interpreter";

export class HandsOnEngine {
  private addressMapping: Map<string, Vertex> = new Map()
  private graph: Graph<Vertex> = new Graph()
  private sortedVertices: Array<Vertex> = []
  private interpreter: Interpreter = new Interpreter(this.addressMapping)

  loadSheet(sheet: Sheet) {
    const graphBuilder = new GraphBuilder(this.graph, this.addressMapping)
    graphBuilder.buildGraph(sheet)
    this.sortedVertices = this.graph.topologicalSort()
    this.recomputeFormulas()
  }

  getCellValue(address: string): CellValue {
    const vertex = this.addressMapping.get(address)!
    return vertex.getCellValue()
  }

  setCellContent(address: string, newCellContent: string) {
    const vertex = this.addressMapping.get(address)
    if (vertex instanceof ValueCellVertex && !isFormula(newCellContent)) {
      if (!isNaN(Number(newCellContent))) {
        vertex.setCellValue(Number(newCellContent))
      } else {
        vertex.setCellValue(newCellContent)
      }
    } else {
      throw Error('Changes to cells other than simple values not supported')
    }

    this.recomputeFormulas()
  }

  recomputeFormulas() {
    this.sortedVertices.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex) {
        const formula = vertex.getFormula()
        const cellValue = this.interpreter.computeFormula(formula)
        vertex.setCellValue(cellValue)
      }
    })
  }
}
