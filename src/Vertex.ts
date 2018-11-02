import {Ast} from "./parser/Ast";
import {CellValue, SimpleCellAddress} from "./Cell";

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
}

export abstract class CellVertex extends Vertex {
  abstract getCellValue(): CellValue
}

export class FormulaCellVertex extends CellVertex {
  private cachedCellValue?: CellValue;
  private formula: Ast;
  private cellAddress: SimpleCellAddress;

  constructor(formula: Ast, cellAddress: SimpleCellAddress) {
    super()
    this.formula = formula;
    this.cellAddress = cellAddress;
  }

  getFormula() : Ast {
    return this.formula
  }

  getAddress() : SimpleCellAddress {
    return this.cellAddress
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

export class ValueCellVertex extends CellVertex {
  private cellValue: CellValue;

  constructor(cellValue: CellValue) {
    super()
    this.cellValue = cellValue;
  }

  getCellValue() {
    return this.cellValue
  }

  setCellValue(cellValue: CellValue) {
    this.cellValue = cellValue
  }
}

export class EmptyCellVertex extends CellVertex {
  constructor() {
    super()
  }

  getCellValue() {
    return 0
  }
}

export class RangeVertex extends Vertex {
  private valueCache: Map<string, CellValue>

  constructor(private start: SimpleCellAddress, private end: SimpleCellAddress) {
    super()
    this.valueCache = new Map()
  }

  getRangeValue(functionName: string, functionImplementation: (start: SimpleCellAddress, end: SimpleCellAddress) => CellValue) {
    let value = this.valueCache.get(functionName)

    if (value) {
      return value
    } else {
      value = functionImplementation(this.start, this.end)
      this.valueCache.set(functionName, value)
    }

    return value
  }

  getStart() :SimpleCellAddress {
    return this.start
  }

  getEnd(): SimpleCellAddress {
    return this.end
  }
}
