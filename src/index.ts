import {AddressMapping} from './AddressMapping'
import {absoluteCellAddress, cellAddressFromString, cellError, CellValue, ErrorType} from './Cell'
import {Graph} from './Graph'
import {GraphBuilder, Sheet} from './GraphBuilder'
import {Interpreter} from './interpreter/Interpreter'
import {isFormula} from './parser/ParserWithCaching'
import {Statistics, StatType} from './statistics/Statistics'
import {FormulaCellVertex, RangeVertex, ValueCellVertex, Vertex} from './Vertex'

export class HandsOnEngine {
  private addressMapping: AddressMapping = new AddressMapping()
  private graph: Graph<Vertex> = new Graph()
  private sortedVertices: Vertex[] = []
  private verticesOnCycle: Vertex[] = []
  private interpreter: Interpreter = new Interpreter(this.addressMapping, this.graph)
  private stats: Statistics = new Statistics()

  public loadSheet(sheet: Sheet) {
    this.stats.reset()
    this.stats.start(StatType.OVERALL)

    const graphBuilder = new GraphBuilder(this.graph, this.addressMapping, this.stats)

    this.stats.measure(StatType.GRAPH_BUILD, () => {
      graphBuilder.buildGraph(sheet)
    })

    this.stats.measure(StatType.TOP_SORT, () => {
      ({ sorted: this.sortedVertices, cycled: this.verticesOnCycle } = this.graph.topologicalSort())
    })

    this.stats.measure(StatType.EVALUATION, () => {
      this.recomputeFormulas()
    })

    this.stats.end(StatType.OVERALL)
  }

  public getCellValue(stringAddress: string): CellValue {
    const address = cellAddressFromString(stringAddress, absoluteCellAddress(0, 0))
    const vertex = this.addressMapping.getCell(address)!
    return vertex.getCellValue()
  }

  public getStats() {
    return this.stats.snapshot()
  }

  public setCellContent(stringAddress: string, newCellContent: string) {
    const address = cellAddressFromString(stringAddress, absoluteCellAddress(0, 0))
    const vertex = this.addressMapping.getCell(address)!
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

  public recomputeFormulas() {
    this.verticesOnCycle.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex) {
        vertex.setCellValue(cellError(ErrorType.CYCLE))
      } else {
        throw Error('Only formula vertix can be on cycle')
      }
    })
    this.sortedVertices.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex) {
        const address = vertex.getAddress()
        const formula = vertex.getFormula()
        const cellValue = this.interpreter.computeFormula(formula, address)
        vertex.setCellValue(cellValue)
      } else if (vertex instanceof RangeVertex) {
        vertex.clear()
      }
    })
  }
}
