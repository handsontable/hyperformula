import parse from 'csv-parse/lib/sync'
import stringify from 'csv-stringify/lib/sync'
import {AddressMapping} from './AddressMapping'
import {
  absoluteCellAddress,
  cellAddressFromString, CellError,
  cellError,
  CellValue,
  ErrorType,
  isCellError,
  simpleCellAddress,
} from './Cell'
import {Graph} from './Graph'
import {GraphBuilder, Sheet} from './GraphBuilder'
import {Interpreter} from './interpreter/Interpreter'
import {isFormula} from './parser/ParserWithCaching'
import {Statistics, StatType} from './statistics/Statistics'
import {FormulaCellVertex, RangeVertex, ValueCellVertex, Vertex} from './Vertex'

export class HandsOnEngine {
  public static buildFromCsv(csv: string): HandsOnEngine {
    return HandsOnEngine.buildFromArray(parse(csv))
  }

  public static buildFromArray(sheet: Sheet): HandsOnEngine {
    return new HandsOnEngine(sheet)
  }

  private addressMapping?: AddressMapping
  private graph: Graph<Vertex> = new Graph()
  private sortedVertices: Vertex[] = []
  private verticesOnCycle: Vertex[] = []
  private interpreter?: Interpreter
  private stats: Statistics = new Statistics()

  constructor(sheet: Sheet) {
    this.stats.reset()
    this.stats.start(StatType.OVERALL)

    const {maxRow, maxCol} = this.findBoundaries(sheet)
    this.addressMapping = new AddressMapping(maxCol, maxRow)

    const graphBuilder = new GraphBuilder(this.graph, this.addressMapping, this.stats)
    this.interpreter = new Interpreter(this.addressMapping, this.graph)

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

  public exportAsCSV() {
    const maxRow = this.addressMapping!.getMaximumRow()
    const maxCol = this.addressMapping!.getMaximumCol()

    const arr: Sheet = new Array(maxRow)
    for (let i = 0; i < maxRow; i++) {
      arr[i] = new Array(maxCol)

      for (let j = 0; j < maxCol; j++) {
        const cell = this.addressMapping!.getCell(simpleCellAddress(j, i))

        if (cell == null) {
          arr[i][j] = ''
          continue
        }

        const cellValue = cell.getCellValue()

        if (isCellError(cellValue)) {
          arr[i][j] = `#${(cellValue as CellError).type}!`
        } else {
          arr[i][j] = cellValue.toString()
        }
      }
    }

    return stringify(arr)
  }

  public getCellValue(stringAddress: string): CellValue {
    const address = cellAddressFromString(stringAddress, absoluteCellAddress(0, 0))
    const vertex = this.addressMapping!.getCell(address)!
    return vertex.getCellValue()
  }

  public getStats() {
    return this.stats.snapshot()
  }

  public setCellContent(stringAddress: string, newCellContent: string) {
    const address = cellAddressFromString(stringAddress, absoluteCellAddress(0, 0))
    const vertex = this.addressMapping!.getCell(address)!
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
        const cellValue = this.interpreter!.computeFormula(formula, address)
        vertex.setCellValue(cellValue)
      } else if (vertex instanceof RangeVertex) {
        vertex.clear()
      }
    })
  }

  private findBoundaries(sheet: Sheet): ({ maxRow: number, maxCol: number }) {
    return { maxRow: sheet.length, maxCol: (sheet[0] || []).length }
  }
}
