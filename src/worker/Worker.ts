import {WorkerInitPayload} from "../Distributor";
import {SimpleArrayAddressMapping} from "../SimpleArrayAddressMapping"
import {Graph} from '../Graph'
import {Vertex, FormulaCellVertex, ValueCellVertex, RangeVertex, EmptyCellVertex} from '../Vertex'
import {SimpleCellAddress, CellValue} from '../Cell'
import {Ast} from '../parser/Ast'

const ctx: Worker = self as any;

let addressMapping, graph

export interface WorkerInitializedPayload {
  type: "INITIALIZED"
}

ctx.onmessage = (message) => {
  switch (message.data.type) {
    case "INIT":
      init(message.data)
      break
    case "START":
      start()
      break
  }
}

function init(payload: WorkerInitPayload) {
  console.log("payload", payload)

  // graph reconstruction
  graph = new Graph<Vertex>() // not correct graph yet
  const allNodes: any[] = payload.allNodes
  for (const node of allNodes) {
    let vertex;
    switch (node.kind) {
      case "formula": {
        vertex = new FormulaCellVertex(
          node.vertexId as number,
          node.formula as Ast,
          node.cellAddress as SimpleCellAddress,
        )
        break
      }
      case "value": {
        vertex = new ValueCellVertex(
          node.vertexId as number,
          node.cellValue as CellValue,
        )
        break
      }
      case "empty": {
        vertex = new EmptyCellVertex(node.vertexId)
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
        )
        break
      }
      default:
        throw new Error()
    }
    graph.addNode(vertex)
  }

  addressMapping = new SimpleArrayAddressMapping(
    payload.sheetWidth,
    payload.sheetHeight,
    graph,
    payload.addressMapping,
  )

  // console.log(addressMapping.getCell({ col: 0, row: 0 })) // getting A1

  const response: WorkerInitializedPayload = {
    type: "INITIALIZED"
  }

  ctx.postMessage(response)
}

function start() {

}
