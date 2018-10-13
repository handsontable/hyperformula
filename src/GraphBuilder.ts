import {isFormula} from './parser/ParserWithCaching'
import {Ast, AstNodeType} from "./parser/Ast"
import {ParserWithCaching} from './parser/ParserWithCaching'
import {Graph} from './Graph'
import {EmptyCellVertex, FormulaCellVertex, ValueCellVertex, Vertex} from "./Vertex"
// [
//     ['', '', ''],
//     ['', '', '']
// ]
export type Sheet = Array<Array<string>>

const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

export class GraphBuilder {
  private parser = new ParserWithCaching()

  private graph: Graph<Vertex>
  private addressMapping: Map<string, Vertex>

  constructor(graph: Graph<Vertex>, addressMapping: Map<string, Vertex>) {
    this.graph = graph
    this.addressMapping = addressMapping
  }

  buildGraph(sheet: Sheet) {
    const dependencies: Map<string, Array<string>> = new Map()

    sheet.forEach((row, rowIndex) => {
      row.forEach((cellContent, colIndex) => {
        const cellAddress = cellCoordinatesToLabel(rowIndex, colIndex)
        let vertex = null

        if (isFormula(cellContent)) {
          let ast = this.parser.parse(cellContent)
          vertex = new FormulaCellVertex(ast)
          dependencies.set(cellAddress, Array.from(new Set(ast.addresses)))
        } else if (!isNaN(Number(cellContent))) {
          vertex = new ValueCellVertex(Number(cellContent))
        } else {
          vertex = new ValueCellVertex(cellContent)
        }

        this.graph.addNode(vertex)
        this.addressMapping.set(cellAddress, vertex)
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
