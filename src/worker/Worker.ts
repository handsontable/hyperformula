import {WorkerInitPayload} from "../Distributor";
import {SimpleArrayAddressMapping} from "../SimpleArrayAddressMapping"
import {Graph} from '../Graph'
import {Vertex, FormulaCellVertex, ValueCellVertex, RangeVertex, EmptyCellVertex, CellVertex} from '../Vertex'
import {SimpleCellAddress, CellValue} from '../Cell'
import {Ast} from '../parser/Ast'
import {RangeMapping} from "../RangeMapping";
import {Interpreter} from "../interpreter/Interpreter";
import {Config} from "../Config";

const ctx: Worker = self as any;

let addressMapping: SimpleArrayAddressMapping,
    rangeMapping: RangeMapping,
    graph: Graph<Vertex>,
    nodes: number[],
    interpreter: Interpreter,
    color: number,
    bc: BroadcastChannel

export interface WorkerInitializedPayload {
  type: "INITIALIZED"
}
ctx.onmessage = (message) => {
  switch (message.data.type) {
    case "INIT":
      init(message.data)
      break
    case "START":
      console.log("start!!!")
      start()
      break
  }
}

function init(payload: WorkerInitPayload) {
  console.log("payload", payload)
  console.log("payload", payload)

  // graph reconstruction
  graph = new Graph<Vertex>()
  rangeMapping = new RangeMapping()
  nodes = payload.nodes
  color = payload.color

  bc = new BroadcastChannel("mybus")
  bc.onmessage = (e) => {
    console.log(color, "Received message", e)
  }


  const allNodes: any[] = payload.allNodes
  for (const node of allNodes) {
    let vertex;
    switch (node.kind) {
      case "formula": {
        vertex = new FormulaCellVertex(
            node.vertexId as number,
            node.formula as Ast,
            node.cellAddress as SimpleCellAddress,
            node.color
        )
        break
      }
      case "value": {
        vertex = new ValueCellVertex(
            node.vertexId as number,
            node.cellValue as CellValue,
            node.color
        )
        break
      }
      case "empty": {
        vertex = new EmptyCellVertex(node.vertexId, node.color)
        EmptyCellVertex.instance = vertex
        break
      }
      case "range": {
        // something should be done about restoring caches here
        // not sure whether Map copies correctly, it's just Object here
        vertex = new RangeVertex(
            node.vertexId as number,
            node.start as SimpleCellAddress,
            node.end as SimpleCellAddress,
            node.color
        )
        rangeMapping.setRange(vertex)
        break
      }
      default:
        throw new Error()
    }
    graph.addNode(vertex)
  }

  const numberOfEdges = payload.allEdges.length / 2
  for (let i = 0; i < numberOfEdges; i++) {
    graph.addEdgeByIds(payload.allEdges[i * 2], payload.allEdges[i * 2 + 1])
  }

  addressMapping = new SimpleArrayAddressMapping(
      payload.sheetWidth,
      payload.sheetHeight,
      graph,
      color,
      payload.addressMapping,
  )

  interpreter = new Interpreter(addressMapping, rangeMapping, graph, new Config())

  // console.log(addressMapping.getCell({ col: 0, row: 0 })) // getting A1

  const response: WorkerInitializedPayload = {
    type: "INITIALIZED"
  }

  ctx.postMessage(response)
}

async function start() {
  bc.postMessage(`message from ${color}`)

  const myNodes = nodes.map(node => graph.getNodeById(node))

  console.log(color, nodes)

  for (const vertex of myNodes) {
    if (vertex instanceof FormulaCellVertex) {
      const address = vertex.getAddress()
      const formula = vertex.getFormula()
      const cellValue = await interpreter.evaluateAst(formula, address)
      vertex.setCellValue(cellValue)
    } else if (vertex instanceof RangeVertex) {
      vertex.clear()
    }
  }

  console.log(color, graph)

  graph.nodes.forEach(node => {
    try {
    console.log(color, (node as CellVertex).getCellValue())
    } catch (e) {
      console.log(color, "no value")
    }
  })

}
