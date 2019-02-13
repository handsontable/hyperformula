import {WorkerInitPayload} from "../Distributor";

const ctx: Worker = self as any;

ctx.onmessage = (message) => {
  switch (message.data.type) {
    case "INIT": init(message.data)
  }
}

function init(payload: WorkerInitPayload) {
  console.log(payload)
}