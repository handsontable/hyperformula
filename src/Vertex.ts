import {Ast} from "./AstNodeType";

type VertexId = number;
let nextVertexId = 0;
const getNextVertexId = () : VertexId => {
  return nextVertexId++;
}

export abstract class Vertex {
  public readonly id: VertexId;

  protected constructor() {
    this.id = getNextVertexId();
  }

  abstract getCellValue(): CellValue
}

export type CellValue = string | number;

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

  setCellValue(cellValue: CellValue) {
     this.cachedCellValue = cellValue
  }

  getCellValue() {
    if (this.cachedCellValue != null) {
      return this.cachedCellValue
    } else {
      throw Error("Value of the formula cell is not computed.")
    }
  }
}

export class ValueCellVertex extends Vertex {
  private cellValue: CellValue;

  constructor(cellValue: CellValue) {
    super()
    this.cellValue = cellValue;
  }

  getCellValue() {
    return this.cellValue
  }
}

export class EmptyCellVertex extends Vertex {
  constructor() {
    super()
  }

  getCellValue() {
    return '0'
  }
}
