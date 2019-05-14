import {SimpleCellAddress, CellValue, CellError, ErrorType} from "../Cell"
import {AbsoluteCellRange} from "../AbsoluteCellRange"
import {Matrix} from "../Matrix"
import {Ast} from "../parser/Ast"
import {Graph} from "../Graph"
import {RangeMapping} from "../RangeMapping"
import {Vertex, MatrixVertex, FormulaCellVertex, ValueCellVertex, RangeVertex, EmptyCellVertex} from "../Vertex"
import {SerializedMapping, AddressMapping, SparseStrategy, DenseStrategy} from "../AddressMapping"
import {Config} from "../Config"
import {Statistics, StatType} from "../statistics/Statistics"
import {Interpreter} from "../interpreter/Interpreter"

class Main {
  // This is only to make typechecking work from Main Thread PoV
  public id: number = -1

  public afterInitialization() {
  }

  public onmessage: (message: any) => any = (message) => {}
  public onmessageWrapper: (messageData: any) => any = (messageData) => ({ data: messageData })
  public sendMessage(data: any) {
    this.onmessage(this.onmessageWrapper(data))
  }

  public postMessage(data: any): void {
    const stats = new Statistics()
    stats.start(StatType.DESERIALIZATION)
    const graph = new Graph<Vertex>()
    const addressMapping = AddressMapping.build(1.0)
    const rangeMapping = new RangeMapping()
    const serializedNodes = data.vertices
    const serializedEdges = data.edges
    const nodes: Vertex[] = []

    nodes.push(EmptyCellVertex.getSingletonInstance())
    graph.addNode(EmptyCellVertex.getSingletonInstance())

    for (const node of serializedNodes) {
      if (node.kind === "empty") {
        continue
      }
      let vertex;
      switch (node.kind) {
        case "formula": {
          vertex = new FormulaCellVertex(
            node.formula as Ast,
            node.cellAddress as SimpleCellAddress,
            node.id as number,
          )
          break
        }
        case "value": {
          vertex = new ValueCellVertex(
            node.cellValue as CellValue,
            node.id as number,
          )
          break
        }
        case "range": {
          // something should be done about restoring caches here
          // not sure whether Map copies correctly, it's just Object here
          vertex = new RangeVertex(
            new AbsoluteCellRange(node.range.start, node.range.end),
            node.id as number,
          )
          rangeMapping.setRange(vertex)
          break
        }
        case "matrix": {
          vertex = new MatrixVertex(
            node.cellAddress as SimpleCellAddress,
            node.width as number,
            node.height as number,
            node.formula as Ast,
            node.id as number
          )
          const matrix = new Matrix(node.matrix.matrix)
          vertex.setCellValue(matrix)
          break
        }
        default:
          throw new Error()
      }
      graph.addNode(vertex)
      nodes.push(vertex)
    }

    const numberOfEdges = serializedEdges.length / 2
    for (let i = 0; i < numberOfEdges; i++) {
      graph.addEdgeByIds(serializedEdges[i * 2], serializedEdges[i * 2 + 1])
    }

    for (const serializedMappingData of data.mappings) {
      const { sheetId, serializedMapping } = serializedMappingData as { sheetId: number, serializedMapping: SerializedMapping }
      let strategy
      switch (serializedMapping.kind) {
        case "sparse": {
          strategy = SparseStrategy.fromSerialized(serializedMapping, graph)
          break
        }
        case "dense": {
          strategy = DenseStrategy.fromSerialized(serializedMapping, graph)
          break
        }
        default: {
          throw new Error("Unknown strategy")
        }
      }
      addressMapping.addSheet(sheetId, strategy)
    }
    stats.end(StatType.DESERIALIZATION)

    const config = new Config({ gpuMode: 'cpu' })
    const interpreter = new Interpreter(addressMapping, rangeMapping, graph, config)
    stats.start(StatType.TOP_SORT)
    const { sorted, cycled } = graph.topologicalSort()
    stats.end(StatType.TOP_SORT)
    const results: { address: SimpleCellAddress, result: CellValue }[] = []

    stats.start(StatType.EVALUATION)
    cycled.forEach((vertex: Vertex) => {
      const cellValue = new CellError(ErrorType.CYCLE)
      results.push({
        address: (vertex as FormulaCellVertex).getAddress(),
        result: cellValue
      });
      (vertex as FormulaCellVertex).setCellValue(cellValue)
    })
    sorted.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex || (vertex instanceof MatrixVertex && vertex.isFormula())) {
        const address = vertex.getAddress()
        const formula = vertex.getFormula() as Ast
        const cellValue = interpreter.evaluateAst(formula, address)
        results.push({
          address,
          result: cellValue,
        })
        vertex.setCellValue(cellValue)
      }
    })
    stats.end(StatType.EVALUATION)

    // console.warn(stats.snapshot())

    this.sendMessage(results)
  }
}

if (typeof self !== 'undefined') {
  const ctx: Worker = self as any;

  const main = new Main()
  main.onmessage = ctx.postMessage.bind(ctx)
  main.onmessageWrapper = (messageData) => messageData
  main.afterInitialization()

  ctx.onmessage = (message) => {
    main.postMessage(message.data)
  }
}

export default Main;
