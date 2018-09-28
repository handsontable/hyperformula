import {Parser} from './parser/parser'
import {AstNodeType} from "./AstNodeType"
import {Graph} from './Graph'
import {FormulaCellVertex, ValueCellVertex, Vertex} from "./Vertex"
// [
//     ['', '', ''],
//     ['', '', '']
// ]
type Sheet = Array<Array<string>>

const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

export class GraphBuilder {
  private parser = new Parser()

  buildGraph(sheet: Sheet): Graph<Vertex> {
    let graph = new Graph<Vertex>()
    let addressMapping: Map<string, Vertex> = new Map()
    let dependencies: Map<string, Array<string>> = new Map()

    sheet.forEach((row, rowIndex) => {
      row.forEach((cellContent, colIndex) => {
        let cellAddress = cellCoordinatesToLabel(rowIndex, colIndex)
        let vertex = null

        if (this.isFormula(cellContent)) {
          let ast = this.parser.parse(cellContent.substr(1))
          vertex = new FormulaCellVertex(ast)
          graph.addNode(vertex)
          dependencies.set(cellAddress, this.getVertexDependencies(vertex, rowIndex, colIndex))
        } else {
          vertex = new ValueCellVertex(cellContent)
          graph.addNode(vertex)
        }

        addressMapping.set(cellCoordinatesToLabel(rowIndex, colIndex), vertex)
      })
    })

    dependencies.forEach((cellDependencies: Array<string>, startCell: string) => {
      cellDependencies.forEach((endCell: string) => {
        if (addressMapping.has(startCell) && addressMapping.has(endCell)) {
          graph.addEdge(addressMapping.get(startCell)!!, addressMapping.get(endCell)!!)
        } else {
          throw Error(`One of this nodes does not exist in graph: ${startCell}, ${endCell}`)
        }
      })
    })

    return graph
  }

  private getVertexDependencies(vertex: FormulaCellVertex, rowIndex: number, colIndex: number) : Array<string>{
    /* TODO simplest case for =A5 like formulas */
    let ast = vertex.getFormula()

    let dependencies = []

    if (ast.type == AstNodeType.RELATIVE_CELL) {
      dependencies.push(ast.args[0] as string)
    }

    return dependencies
  }

  private isFormula(cellContent: string): Boolean {
    return cellContent.startsWith('=')
  }
}



function cellCoordinatesToLabel(rowIndex: number, colIndex: number): string {
  return columnIndexToLabel(colIndex) + (rowIndex + 1)
}

function columnIndexToLabel(column: number) {
  let result = '';

  while (column >= 0) {
    result = String.fromCharCode((column % COLUMN_LABEL_BASE_LENGTH) + 97) + result;
    column = Math.floor(column / COLUMN_LABEL_BASE_LENGTH) - 1;
  }

  return result.toUpperCase();
}