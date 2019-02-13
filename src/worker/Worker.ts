import {WorkerInitPayload} from "../Distributor";

const ctx: Worker = self as any;

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

  const response: WorkerInitializedPayload = {
    type: "INITIALIZED"
  }

  ctx.postMessage(response)
}

function start() {

}