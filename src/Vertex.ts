type VertexId = number;
let nextVertexId = 0;
const getNextVertexId = () : VertexId => {
  return nextVertexId++;
}

export class Vertex {
  public readonly id: VertexId;

  constructor() {
    this.id = getNextVertexId();
  }
}

type Ast = string // Only for sake of type-checking, a legit tree in the future

type CellValue = string | number;

export class FormulaCellVertex extends Vertex {
  private cachedCellValue?: CellValue;
  private formula: Ast;

  constructor(formula: Ast) {
    super()
    this.formula = formula;
  }
}

export class ValueCellVertex extends Vertex {
  private cellValue: CellValue;

  constructor(cellValue: CellValue) {
    super()
    this.cellValue = cellValue;
  }
}
