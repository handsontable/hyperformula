// import {LexerWorkerResponse} from "./Worker";
// import {isFunction} from "util";
import Worker from "worker-loader!./Worker";

export class Pool {
  private workers: Worker[] = []
  private size: number;

  constructor(size: number) {
    this.size = size;
  }

  public addWorkerTaskForAllWorkers(workerTaskFunction: ((workerId: number) => WorkerTask)) {
    for (const worker of this.workers) {
      const { data, callback } = workerTaskFunction(worker.id)
      worker.onmessage = callback
      worker.postMessage(data)
    }
  }

  public init() {
    for (var i = 0 ; i < this.size ; i++) {
      const worker = new Worker()
      worker.id = i
      this.workers.push(worker)
    }
  }
}

export interface WorkerTask {
  data: any,
  callback: any
}
