import {GraphBuilder, Sheet} from "./GraphBuilder";
import {CellValue, FormulaCellVertex, ValueCellVertex, Vertex, argError} from "./Vertex";
import {Graph} from "./Graph";
import {Ast, AstNodeType, NumberAst, PlusOpAst, MinusOpAst, TimesOpAst, RelativeCellAst} from "./parser/Ast";
import {FullParser, isFormula} from './parser/FullParser'

export class HandsOnEngine {
  private addressMapping: Map<string, Vertex> = new Map()
  private graph: Graph<Vertex> = new Graph()
  private sortedVertices: Array<Vertex> = []

  loadSheet(sheet: Sheet) {
    const graphBuilder = new GraphBuilder(this.graph, this.addressMapping)
    graphBuilder.buildGraph(sheet)
    this.sortedVertices = this.graph.topologicalSort()
    this.recomputeFormulas()
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

  setCellContent(address: string, newCellContent: string) {
    const parser = new FullParser()
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
        const cellValue = this.computeFormula(formula)
        vertex.setCellValue(cellValue)
      }
    })
  }
}
