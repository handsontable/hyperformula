import {WorkerInitPayload} from "../Distributor";
import {SimpleArrayAddressMapping} from "../SimpleArrayAddressMapping"
import {Vertex} from '../Vertex'
import {Graph} from '../Graph'

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

  graph = new Graph<Vertex>() // not correct graph yet

  addressMapping = new SimpleArrayAddressMapping(
    payload.sheetWidth,
    payload.sheetHeight,
    graph,
    payload.addressMapping,
  )

  const response: WorkerInitializedPayload = {
    type: "INITIALIZED"
  }

  ctx.postMessage(response)
}

function start() {

}
