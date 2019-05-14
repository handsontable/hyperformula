import {Ast} from './parser'
import {Config} from './Config'
import {AddressMapping, SerializedMapping} from './AddressMapping'
import {RangeMapping} from './RangeMapping'
import {Graph} from './Graph'
import {EmptyCellVertex, FormulaCellVertex, MatrixVertex, RangeVertex, ValueCellVertex, Vertex} from './Vertex'
import {Evaluator} from './Evaluator'
import {
  CellError,
  CellValue,
  ErrorType,
  simpleCellAddress,
  SimpleCellAddress,
} from './Cell'
import {Statistics, StatType} from './statistics/Statistics'
import {Interpreter} from './interpreter/Interpreter'
import {Pool} from './worker/Pool'

export class ParallelEvaluator implements Evaluator {
  /** Topologically sorted list of vertices. */
  private sortedVertices: Vertex[] = []

  /** List of vertices which are on some cycle */
  private verticesOnCycle: Vertex[] = []

  private interpreter: Interpreter

  constructor(
    private readonly addressMapping: AddressMapping,
    private readonly rangeMapping: RangeMapping,
    private readonly graph: Graph<Vertex>,
    private readonly config: Config,
    private readonly stats: Statistics,
    private readonly independentSheets: boolean[],
  ) {
    this.interpreter = new Interpreter(this.addressMapping, this.rangeMapping, this.graph, this.config)
  }

  public async run() {
    this.stats.start(StatType.SERIALIZATION)
    const chunks = this.prepareChunks()
    this.stats.end(StatType.SERIALIZATION)
    const chunksPromises: Promise<any>[] = []
    const chunksPromisesResolvers: (() => void)[] = []
    for (const chunk of chunks) {
      const promise = new Promise((resolve) => {
        chunksPromisesResolvers.push(resolve)
      })
      chunksPromises.push(promise)
    }

    const pool = new Pool(chunks.length)
    pool.init()
    pool.addWorkerTaskForAllWorkers((workerId: number) => ({
      data: { kind: "INIT", ...chunks[workerId] },
      callback: (message: any) => {
        this.handleWorkerMessage(message.data as { address: SimpleCellAddress, result:CellValue }[])
        chunksPromisesResolvers[workerId]()
      }
    }))

    await Promise.all(chunksPromises)

    // console.warn(this.stats.snapshot())
  }

  private handleWorkerMessage(messageData: { address: SimpleCellAddress, result:CellValue }[]) {
    for (const result of messageData) {
      const vertex = this.addressMapping.getCell(result.address)
      if (vertex instanceof FormulaCellVertex || (vertex instanceof MatrixVertex && vertex.isFormula())) {
        vertex.setCellValue(result.result)
      }
    }
  }

  private prepareChunks() {
    const chunks = []
    const dependentVertices: { vertices: Vertex[], edges: number[], mappings: { sheetId: number, serializedMapping: SerializedMapping }[] } = {
      vertices: [],
      edges: [],
      mappings: [],
    }
    for (let sheetId = 0; sheetId < this.independentSheets.length; sheetId++) {
      let vertices = this.addressMapping.getAllVerticesFromSheet(sheetId).concat(this.rangeMapping.getAllVerticesFromSheet(sheetId))
      const edges = []
      for (const node of vertices) {
        for (const adjacentNode of this.graph.adjacentNodes(node)) {
          edges.push(node.id)
          edges.push(adjacentNode.id)
        }
      }
      const serializedMapping = this.addressMapping.getSerializedMapping(sheetId)
      if (this.independentSheets[sheetId] === true) {
        const chunk = {
          vertices, 
          edges,
          mappings: [{ sheetId, serializedMapping }],
        }
        chunks.push(chunk)
      } else if (this.independentSheets[sheetId] === false) {
        dependentVertices.vertices = dependentVertices.vertices.concat(vertices)
        dependentVertices.edges = dependentVertices.edges.concat(edges)
        dependentVertices.mappings.push({ sheetId, serializedMapping })
      }
    }
    if (dependentVertices.mappings.length > 0) {
      chunks.unshift(dependentVertices)
    }
    return chunks
  }
}
