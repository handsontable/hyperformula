import {SimpleCellAddress, CellValue} from "../Cell"
import {AbsoluteCellRange} from "../AbsoluteCellRange"
import {Matrix} from "../Matrix"
import {Ast} from "../parser/Ast"
import {Graph} from "../Graph"
import {RangeMapping} from "../RangeMapping"
import {Vertex, MatrixVertex, FormulaCellVertex, ValueCellVertex, RangeVertex, EmptyCellVertex} from "../Vertex"

class Main {
  // This is only to make typechecking work from Main Thread PoV
  public id: number = -1

  public afterInitialization() {
  }

  public onmessage: (message: any) => any = () => {}

  public postMessage(data: any): void {
    // console.log("Got message!")
    // console.log(data)
    const graph = new Graph<Vertex>()
    const rangeMapping = new RangeMapping()
    const serializedNodes = data.vertices
    const nodes: Vertex[] = []

    nodes.push(EmptyCellVertex.getSingletonInstance())
    graph.addNode(EmptyCellVertex.getSingletonInstance())

    for (const node of serializedNodes) {
      if (node.kind === "empty") {
        continue
      }
      let vertex;
      switch (node.kind) {
        case "formula": {
          vertex = new FormulaCellVertex(
            node.formula as Ast,
            node.cellAddress as SimpleCellAddress,
            node.vertexId as number,
          )
          break
        }
        case "value": {
          vertex = new ValueCellVertex(
            node.cellValue as CellValue,
            node.vertexId as number,
          )
          break
        }
        case "range": {
          // something should be done about restoring caches here
          // not sure whether Map copies correctly, it's just Object here
          vertex = new RangeVertex(
            new AbsoluteCellRange(node.range.start, node.range.end),
            node.vertexId as number,
          )
          rangeMapping.setRange(vertex)
          break
        }
        case "matrix": {
          vertex = new MatrixVertex(
            node.cellAddress as SimpleCellAddress,
            node.width as number,
            node.height as number,
            node.formula as Ast,
            node.id as number
          )
          const matrix = new Matrix(node.matrix.matrix)
          vertex.setCellValue(matrix)
          break
        }
        default:
          throw new Error()
      }
      graph.addNode(vertex)
      nodes.push(vertex)
    }
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
    main.postMessage(message.data)
  }
}

export default Main;
