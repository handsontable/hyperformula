import { Ast } from './parser/parser'

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

type CellValue = string | number;

export class FormulaCellVertex extends Vertex {
  private cachedCellValue?: CellValue;
  private formula: Ast;

  constructor(formula: Ast) {
    super()
    this.formula = formula;
  }

  getFormula() : Ast {
    return this.formula
  }
}

export class ValueCellVertex extends Vertex {
  private cellValue: CellValue;

  constructor(cellValue: CellValue) {
    super()
    this.cellValue = cellValue;
  }
}
