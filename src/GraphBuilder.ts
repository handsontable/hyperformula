import {
  absoluteCellAddress,
  CellAddress,
  CellDependency,
  getAbsoluteAddress,
  simpleCellAddress,
  SimpleCellAddress,
} from './Cell'
import {Graph} from './Graph'
import {IAddressMapping} from './IAddressMapping'
import {isFormula, ParserWithCaching} from './parser/ParserWithCaching'
import {RangeMapping} from './RangeMapping'
import {Statistics, StatType} from './statistics/Statistics'
import {CellVertex, EmptyCellVertex, FormulaCellVertex, RangeVertex, ValueCellVertex, Vertex} from './Vertex'

export type Sheet = string[][]

export class GraphBuilder {
  private parser = new ParserWithCaching()

  constructor(private graph: Graph<Vertex>,
              private addressMapping: IAddressMapping,
              private rangeMapping: RangeMapping,
              private stats: Statistics) {
  }

  public buildGraph(sheet: Sheet) {
    const dependencies: Map<SimpleCellAddress, CellDependency[]> = new Map()

    this.graph.addNode(EmptyCellVertex.getSingletonInstance())

    sheet.forEach((row, rowIndex) => {
      row.forEach((cellContent, colIndex) => {
        const cellAddress = simpleCellAddress(colIndex, rowIndex)
        let vertex = null

        if (isFormula(cellContent)) {
          const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
          vertex = new FormulaCellVertex(parseResult.ast, cellAddress)
          dependencies.set(cellAddress, parseResult.dependencies)
          this.graph.addNode(vertex)
          this.addressMapping.setCell(cellAddress, vertex)
        } else if (cellContent === '') {
          /* we don't care about empty cells here */
        } else if (!isNaN(Number(cellContent))) {
          vertex = new ValueCellVertex(Number(cellContent))
          this.graph.addNode(vertex)
          this.addressMapping.setCell(cellAddress, vertex)
        } else {
          vertex = new ValueCellVertex(cellContent)
          this.graph.addNode(vertex)
          this.addressMapping.setCell(cellAddress, vertex)
        }
      })
    })

    dependencies.forEach((cellDependencies: CellDependency[], endCell: SimpleCellAddress) => {
      cellDependencies.forEach((absStartCell: CellDependency) => {
        if (!this.addressMapping.has(endCell)) {
          throw Error(`${endCell} does not exist in graph`)
        }

        if (Array.isArray(absStartCell)) {
          const [rangeStart, rangeEnd] = absStartCell
          let rangeVertex = this.rangeMapping.getRange(rangeStart, rangeEnd)
          if (rangeVertex === null) {
            rangeVertex = new RangeVertex(rangeStart, rangeEnd)
            this.rangeMapping.setRange(rangeVertex)
          }

          this.graph.addNode(rangeVertex)

          const {smallerRangeVertex, restRangeStart, restRangeEnd} = findSmallerRange(this.rangeMapping, rangeStart, rangeEnd)
          if (smallerRangeVertex) {
            this.graph.addEdge(smallerRangeVertex, rangeVertex)
          }
          for (const cellFromRange of generateCellsFromRangeGenerator(restRangeStart, restRangeEnd)) {
            this.graph.addEdge(this.addressMapping.getCell(cellFromRange), rangeVertex!)
          }

          this.graph.addEdge(rangeVertex, this.addressMapping.getCell(endCell)!)
        } else {
          this.graph.addEdge(this.addressMapping.getCell(absStartCell), this.addressMapping.getCell(endCell)!)
        }
      })
    })
  }
}

export const generateCellsFromRangeGenerator = function *(rangeStart: SimpleCellAddress, rangeEnd: SimpleCellAddress) {
  let currentRow = rangeStart.row
  while (currentRow <= rangeEnd.row) {
    let currentColumn = rangeStart.col
    while (currentColumn <= rangeEnd.col) {
      yield simpleCellAddress(currentColumn, currentRow)
      currentColumn++
    }
    currentRow++
  }
}

export const findSmallerRange = (rangeMapping: RangeMapping, rangeStart: SimpleCellAddress, rangeEnd: SimpleCellAddress): {smallerRangeVertex: RangeVertex | null, restRangeStart: SimpleCellAddress, restRangeEnd: SimpleCellAddress} => {
  if (rangeEnd.row > rangeStart.row) {
    const rangeEndRowLess = simpleCellAddress(rangeEnd.col, rangeEnd.row - 1)
    const rowLessVertex = rangeMapping.getRange(rangeStart, rangeEndRowLess)
    if (rowLessVertex) {
      return {
        smallerRangeVertex: rowLessVertex,
        restRangeStart: rangeEnd,
        restRangeEnd: rangeEnd,
      }
    }
  }
  return {
    smallerRangeVertex: null,
    restRangeStart: rangeStart,
    restRangeEnd: rangeEnd,
  }
}
