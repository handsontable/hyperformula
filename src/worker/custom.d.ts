declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();

    public id: number
  }

  export default WebpackWorker;
}
