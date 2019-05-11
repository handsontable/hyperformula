import Main from "./Main.worker";
import {Vertex} from "../Vertex"

export class Pool {
  private workers: Main[] = []
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
      const worker = new Main()
      worker.id = i
      this.workers.push(worker)
    }
  }
}

export interface WorkerTask {
  data: {
    kind: "INIT",
    vertices: Array<Vertex>,
    edges: number[],
  },
  callback: any,
}
