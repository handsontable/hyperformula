class Main {
  // This is only to make typechecking work from Main Thread PoV
  public id: number = -1

  public afterInitialization() {
  }

  public onmessage: (message: any) => any = () => {}

  public postMessage(message: any): void {
    // console.log("Got message!")
    // console.log(message)
    // console.log(this.onmessage)
    this.onmessage(42)
  }
}

if (typeof self !== 'undefined') {
  const ctx: Worker = self as any;

  const main = new Main()
  main.onmessage = ctx.postMessage.bind(ctx)
  main.afterInitialization()

  ctx.onmessage = (message) => {
    main.postMessage(message)
  }
}

export default Main;
