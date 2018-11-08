import {AddressMapping} from './AddressMapping'
import {
  absoluteCellAddress,
  CellAddress,
  CellDependency,
  getAbsoluteAddress,
  relativeCellAddress,
  simpleCellAddress,
  SimpleCellAddress,
} from './Cell'
import {Graph} from './Graph'
import {isFormula, ParserWithCaching} from './parser/ParserWithCaching'
import {Statistics, StatType} from './statistics/Statistics'
import {CellVertex, EmptyCellVertex, FormulaCellVertex, RangeVertex, ValueCellVertex, Vertex} from './Vertex'

export type Sheet = string[][]

export class GraphBuilder {
  private parser = new ParserWithCaching()

  constructor(private graph: Graph<Vertex>,
              private addressMapping: AddressMapping,
              private stats: Statistics) {
  }

  public buildGraph(sheet: Sheet) {
    const dependencies: Map<SimpleCellAddress, CellDependency[]> = new Map()

    sheet.forEach((row, rowIndex) => {
      row.forEach((cellContent, colIndex) => {
        const cellAddress = simpleCellAddress(colIndex, rowIndex)
        let vertex = null

        if (isFormula(cellContent)) {
          const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
          vertex = new FormulaCellVertex(parseResult.ast, cellAddress)
          dependencies.set(cellAddress, parseResult.dependencies)
        } else if (!isNaN(Number(cellContent))) {
          vertex = new ValueCellVertex(Number(cellContent))
        } else {
          vertex = new ValueCellVertex(cellContent)
        }

        this.graph.addNode(vertex)

        this.addressMapping.setCell(cellAddress, vertex)
      })
    })

    dependencies.forEach((cellDependencies: CellDependency[], endCell: SimpleCellAddress) => {
      cellDependencies.forEach((absStartCell: CellDependency) => {
        if (!this.addressMapping.has(endCell)) {
          throw Error(`${endCell} does not exist in graph`)
        }

        if (Array.isArray(absStartCell)) {
          const [rangeStart, rangeEnd] = absStartCell
          let rangeVertex = this.addressMapping.getRange(rangeStart, rangeEnd)
          if (rangeVertex === null) {
            rangeVertex = new RangeVertex(rangeStart, rangeEnd)
            this.addressMapping.setRange(rangeVertex)
          }

          this.graph.addNode(rangeVertex)

          const {smallerRangeVertex, restRangeStart, restRangeEnd} = findSmallerRange(this.addressMapping, rangeStart, rangeEnd)
          if (smallerRangeVertex) {
            this.graph.addEdge(smallerRangeVertex, rangeVertex)
          }
          generateCellsFromRange(restRangeStart, restRangeEnd).forEach((rowOfCells) => {
            rowOfCells.forEach((cellFromRange) => {
              const vertex = this.getOrCreateVertex(cellFromRange)
              this.graph.addEdge(vertex, rangeVertex!)
            })
          })

          this.graph.addEdge(rangeVertex, this.addressMapping.getCell(endCell)!)
        } else {
          const vertex = this.getOrCreateVertex(absStartCell)
          this.graph.addEdge(vertex, this.addressMapping.getCell(endCell)!)
        }
      })
    })
  }

  private getOrCreateVertex(address: SimpleCellAddress): CellVertex {
    let vertex = this.addressMapping.getCell(address)
    if (!vertex) {
      vertex = new EmptyCellVertex()
      this.graph.addNode(vertex)
      this.addressMapping.setCell(address, vertex)
    }
    return vertex
  }
}

export const generateCellsFromRange = (rangeStart: SimpleCellAddress, rangeEnd: SimpleCellAddress): SimpleCellAddress[][] => {
  const result = []
  let currentRow = rangeStart.row
  while (currentRow <= rangeEnd.row) {
    const rowResult = []
    let currentColumn = rangeStart.col
    while (currentColumn <= rangeEnd.col) {
      rowResult.push(relativeCellAddress(currentColumn, currentRow))
      currentColumn++
    }
    result.push(rowResult)
    currentRow++
  }
  return result
}

export const findSmallerRange = (addressMapping: AddressMapping, rangeStart: SimpleCellAddress, rangeEnd: SimpleCellAddress): {smallerRangeVertex: RangeVertex | null, restRangeStart: SimpleCellAddress, restRangeEnd: SimpleCellAddress} => {
  if (rangeEnd.row > rangeStart.row) {
    const rangeEndRowLess = simpleCellAddress(rangeEnd.col, rangeEnd.row - 1)
    const rowLessVertex = addressMapping.getRange(rangeStart, rangeEndRowLess)
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
