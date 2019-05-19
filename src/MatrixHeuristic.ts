import {Graph} from "./Graph";
import {Vertex} from "./Vertex";
import {CellDependency} from "./CellDependency";
import {Array2d} from "./GraphBuilderMatrixHeuristic";


export class MatrixHeuristic {

  private mapping: Map<number, Array2d<string>> = new Map()


  constructor(
      private readonly sheetId: number,
      private readonly graph: Graph<Vertex>,
      private readonly dependencies: Map<Vertex, CellDependency[]>,
      private readonly width: number,
      private readonly height: number,
  ) {

  }

  public add(hash: string,) {
    this.mapping
  }

  public start() {

  }
}
