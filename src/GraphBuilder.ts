import {isFormula, ParserWithCaching} from './parser/ParserWithCaching'
import {Graph} from './Graph'
import {CellVertex, EmptyCellVertex, FormulaCellVertex, RangeVertex, ValueCellVertex, Vertex, CellAddress} from "./Vertex"
import {Statistics, StatType} from "./statistics/Statistics";
import {CellDependency} from "./parser/Ast"

export type Sheet = Array<Array<string>>

const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

export class GraphBuilder {
  private parser = new ParserWithCaching()

  constructor(private graph: Graph<Vertex>,
              private addressMapping: Map<number, Map<number, CellVertex>>,
              private stats: Statistics) {
  }

  buildGraph(sheet: Sheet) {
    const dependencies: Map<CellAddress, Array<CellDependency>> = new Map()

    sheet.forEach((row, rowIndex) => {
      row.forEach((cellContent, colIndex) => {
        const cellAddress = cellCoordinatesToLabel(rowIndex, colIndex)
        let vertex = null

        if (isFormula(cellContent)) {
          let ast = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent))
          vertex = new FormulaCellVertex(ast)
          dependencies.set(cellAddress, Array.from(new Set(ast.addresses)))
        } else if (!isNaN(Number(cellContent))) {
          vertex = new ValueCellVertex(Number(cellContent))
        } else {
          vertex = new ValueCellVertex(cellContent)
        }

        this.graph.addNode(vertex)

        let colMapping = this.addressMapping.get(cellAddress.col)
        if (!colMapping) {
          colMapping = new Map()
          this.addressMapping.set(cellAddress.col, colMapping)
        }
        colMapping.set(cellAddress.row, vertex)
      })
    })

    dependencies.forEach((cellDependencies: Array<CellDependency>, endCell: CellAddress) => {
      cellDependencies.forEach((startCell: CellDependency) => {
        if (!this.addressMapping.has(endCell.col) || !this.addressMapping.get(endCell.col)!.has(endCell.row)) {
          throw Error(`${endCell} does not exist in graph`)
        }

        if (Array.isArray(startCell)) {
          const [rangeStart, rangeEnd] = startCell
          const vertex = new RangeVertex()
          this.graph.addNode(vertex)
          generateCellsFromRange(rangeStart, rangeEnd).forEach((rowOfCells) => {
            rowOfCells.forEach((cellFromRange) => {
              this.graph.addEdge(this.addressMapping.get(cellFromRange.col)!.get(cellFromRange.row)!, vertex)
            })
          })
          this.graph.addEdge(vertex, this.addressMapping.get(endCell.col)!.get(endCell.row)!)
        } else {
          let vertex : CellVertex
          if (this.addressMapping.has(startCell.col) && this.addressMapping.get(startCell.col)!.has(startCell.row)) {
            vertex = this.addressMapping.get(startCell.col)!.get(startCell.row)!
          } else {
            vertex = new EmptyCellVertex()
            this.graph.addNode(vertex)

            let colMapping = this.addressMapping.get(startCell.col)
            if (!colMapping) {
              colMapping = new Map()
              this.addressMapping.set(startCell.col, colMapping)
            }
            colMapping.set(startCell.row, vertex)
          }
          this.graph.addEdge(vertex, this.addressMapping.get(endCell.col)!.get(endCell.row)!)
        }
      })
    })
  }
}

export function cellCoordinatesToLabel(rowIndex: number, colIndex: number): CellAddress {
  return { col: colIndex, row: rowIndex }
}

function columnIndexToLabel(column: number) {
  let result = '';

  while (column >= 0) {
    result = String.fromCharCode((column % COLUMN_LABEL_BASE_LENGTH) + 97) + result;
    column = Math.floor(column / COLUMN_LABEL_BASE_LENGTH) - 1;
  }

  return result.toUpperCase();
}

export const generateCellsFromRange = (rangeStart: CellAddress, rangeEnd: CellAddress): CellAddress[][] => {
  const result = []
  let currentRow = rangeStart.row
  while (currentRow <= rangeEnd.row) {
    const rowResult = []
    let currentColumn = rangeStart.col;
    while (currentColumn <= rangeEnd.col) {
      rowResult.push({ row: currentRow, col: currentColumn })
      currentColumn++
    }
    result.push(rowResult)
    currentRow++
  }
  return result
}
