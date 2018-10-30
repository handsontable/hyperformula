import {isFormula, ParserWithCaching} from './parser/ParserWithCaching'
import {Graph} from './Graph'
import {CellVertex, EmptyCellVertex, FormulaCellVertex, RangeVertex, ValueCellVertex, Vertex} from "./Vertex"
import {Statistics, StatType} from "./statistics/Statistics";
import {
  absoluteCellAddress,
  CellAddress,
  CellDependency,
  getAbsoluteAddress,
  getAbsoluteDependency,
  relativeCellAddress
} from "./Cell"
import {AddressMapping} from "./AddressMapping"
import {getFormulaDependencies} from "./parser/Ast";

export type Sheet = Array<Array<string>>

export class GraphBuilder {
  private parser = new ParserWithCaching()

  constructor(private graph: Graph<Vertex>,
              private addressMapping: AddressMapping,
              private stats: Statistics) {
  }

  buildGraph(sheet: Sheet) {
    const dependencies: Map<CellAddress, Array<CellDependency>> = new Map()

    sheet.forEach((row, rowIndex) => {
      row.forEach((cellContent, colIndex) => {
        const cellAddress = absoluteCellAddress(colIndex, rowIndex)
        let vertex = null

        if (isFormula(cellContent)) {
          let ast = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
          vertex = new FormulaCellVertex(ast)
          dependencies.set(cellAddress, Array.from(new Set(getFormulaDependencies(ast))))
        } else if (!isNaN(Number(cellContent))) {
          vertex = new ValueCellVertex(Number(cellContent))
        } else {
          vertex = new ValueCellVertex(cellContent)
        }

        this.graph.addNode(vertex)

        this.addressMapping.setCell(cellAddress, vertex)
      })
    })

    dependencies.forEach((cellDependencies: Array<CellDependency>, endCell: CellAddress) => {
      cellDependencies.forEach((startCell: CellDependency) => {
        const absStartCell = getAbsoluteDependency(startCell, endCell)

        if (!this.addressMapping.has(endCell)) {
          throw Error(`${endCell} does not exist in graph`)
        }

        if (Array.isArray(absStartCell)) {
          const [rangeStart, rangeEnd] = absStartCell
          const vertex = new RangeVertex()
          this.graph.addNode(vertex)
          generateCellsFromRange(rangeStart, rangeEnd).forEach((rowOfCells) => {
            rowOfCells.forEach((cellFromRange) => {
              this.graph.addEdge(this.addressMapping.getCell(cellFromRange)!, vertex)
            })
          })
          this.graph.addEdge(vertex, this.addressMapping.getCell(endCell)!)
        } else {
          let vertex : CellVertex
          if (this.addressMapping.has(absStartCell)) {
            vertex = this.addressMapping.getCell(absStartCell)!
          } else {
            vertex = new EmptyCellVertex()
            this.graph.addNode(vertex)

            this.addressMapping.setCell(absStartCell, vertex)
          }
          this.graph.addEdge(vertex, this.addressMapping.getCell(endCell)!)
        }
      })
    })
  }
}

export const generateCellsFromRange = (rangeStart: CellAddress, rangeEnd: CellAddress): CellAddress[][] => {
  const result = []
  let currentRow = rangeStart.row
  while (currentRow <= rangeEnd.row) {
    const rowResult = []
    let currentColumn = rangeStart.col;
    while (currentColumn <= rangeEnd.col) {
      rowResult.push(relativeCellAddress(currentColumn, currentRow))
      currentColumn++
    }
    result.push(rowResult)
    currentRow++
  }
  return result
}
