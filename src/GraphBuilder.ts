import {Parser} from './parser/parser'
import {AstNodeType, RelativeCellAst} from "./AstNodeType"
import {Graph} from './Graph'
import {EmptyCellVertex, FormulaCellVertex, ValueCellVertex, Vertex} from "./Vertex"
import {AstBuilder} from "./parser/AstBuilder";
// [
//     ['', '', ''],
//     ['', '', '']
// ]
export type Sheet = Array<Array<string>>

const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

export class GraphBuilder {
  private parser = new Parser()
  private astBuilder = new AstBuilder()

  private graph: Graph<Vertex>
  private addressMapping: Map<string, Vertex>

  constructor(graph: Graph<Vertex>, addressMapping: Map<string, Vertex>) {
    this.graph = graph
    this.addressMapping = addressMapping
  }

  buildGraph(sheet: Sheet) {
    let dependencies: Map<string, Array<string>> = new Map()

    sheet.forEach((row, rowIndex) => {
      row.forEach((cellContent, colIndex) => {
        let cellAddress = cellCoordinatesToLabel(rowIndex, colIndex)
        let vertex = null

        if (this.isFormula(cellContent)) {
          let ast = this.astBuilder.buildAst(this.parser.parse(cellContent.substr(1)))
          vertex = new FormulaCellVertex(ast)
          this.graph.addNode(vertex)
          dependencies.set(cellAddress, this.getVertexDependencies(vertex))
        } else {
          vertex = new ValueCellVertex(cellContent)
          this.graph.addNode(vertex)
        }

        this.addressMapping.set(cellCoordinatesToLabel(rowIndex, colIndex), vertex)
      })
    })

    dependencies.forEach((cellDependencies: Array<string>, endCell: string) => {
      cellDependencies.forEach((startCell: string) => {
        if (!this.addressMapping.has(endCell)) {
          throw Error(`${endCell} does not exist in graph`)
        }

        let vertex : Vertex

        if (this.addressMapping.has(startCell)) {
          vertex = this.addressMapping.get(startCell)!
        } else {
          vertex = new EmptyCellVertex()
          this.graph.addNode(vertex)
          this.addressMapping.set(startCell, vertex)
        }

        this.graph.addEdge(vertex, this.addressMapping.get(endCell)!)
      })
    })
  }

  private getVertexDependencies(vertex: FormulaCellVertex) : Array<string>{
    /* TODO simplest case for =A5 like formulas */
    let ast = vertex.getFormula()

    let dependencies = []

    if (ast instanceof RelativeCellAst) {
      dependencies.push(ast.getAddress())
    }

    return dependencies
  }

  private isFormula(cellContent: string): Boolean {
    return cellContent.startsWith('=')
  }
}

export function cellCoordinatesToLabel(rowIndex: number, colIndex: number): string {
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