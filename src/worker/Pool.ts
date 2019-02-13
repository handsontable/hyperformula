// import {LexerWorkerResponse} from "./Worker";
// import {isFunction} from "util";
import Worker from "worker-loader!./Worker";

export class Pool {
  private taskQueue: WorkerTask[] = [];
  private workerQueue: any[] = [];
  private size: number;
  public counters: number[]

  constructor(size: number) {
    this.size = size;
    this.counters = []
  }

  public addWorkerTask(workerTask: WorkerTask) {
    // console.warn("adding new worker task")
    if (this.workerQueue.length > 0) {
      var worker = this.workerQueue.shift();
      this.scheduleTask(worker, workerTask)
    } else {
      this.taskQueue.push(workerTask);
    }
  }

  private scheduleTask(worker: any, workerTask: WorkerTask) {
    this.counters[worker.id]++
    worker.onmessage = (response: any) => {
      workerTask.callback(response)
      if (this.taskQueue.length > 0) {
        // console.warn(`taking next task, remaining: ${this.taskQueue.length}`)
        this.scheduleTask(worker, this.taskQueue.shift()!)
      } else {
        this.workerQueue.push(worker)
      }
    }
    worker.postMessage(workerTask.data)
  }

  public init() {
    for (var i = 0 ; i < this.size ; i++) {
      const worker = new Worker()
      // worker['id'] = i
      Object.defineProperty(worker, 'id', { value: i, writable: false })
      // console.warn(worker)]
      this.workerQueue.push(worker)
      this.counters.push(0)
    }
  }
}

export interface WorkerTask {
  data: any,
  callback: any
}

