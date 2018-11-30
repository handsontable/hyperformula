import {CellValue, SimpleCellAddress} from './Cell'
import {Ast} from './parser/Ast'

export abstract class Vertex {
}

export abstract class CellVertex extends Vertex {
  public abstract getCellValue(): CellValue
}

export class FormulaCellVertex extends CellVertex {
  private cachedCellValue?: CellValue
  private formula: Ast
  private cellAddress: SimpleCellAddress

  constructor(formula: Ast, cellAddress: SimpleCellAddress) {
    super()
    this.formula = formula
    this.cellAddress = cellAddress
  }

  public getFormula(): Ast {
    return this.formula
  }

  public getAddress(): SimpleCellAddress {
    return this.cellAddress
  }

  public setCellValue(cellValue: CellValue) {
     this.cachedCellValue = cellValue
  }

  public getCellValue() {
    if (this.cachedCellValue != null) {
      return this.cachedCellValue
    } else {
      throw Error('Value of the formula cell is not computed.')
    }
  }
}

export class ValueCellVertex extends CellVertex {
  private cellValue: CellValue

  constructor(cellValue: CellValue) {
    super()
    this.cellValue = cellValue
  }

  public getCellValue() {
    return this.cellValue
  }

  public setCellValue(cellValue: CellValue) {
    this.cellValue = cellValue
  }
}

export class EmptyCellVertex extends CellVertex {

  public static getSingletonInstance() {
    if (!EmptyCellVertex.instance) {
      EmptyCellVertex.instance = new EmptyCellVertex()
    }
    return EmptyCellVertex.instance
  }
  private static instance: EmptyCellVertex

  constructor() {
    super()
  }

  public getCellValue() {
    return 0
  }
}

export class RangeVertex extends Vertex {
  private valueCache: Map<string, CellValue>

  constructor(private start: SimpleCellAddress, private end: SimpleCellAddress) {
    super()
    this.valueCache = new Map()
  }

  public getRangeValue(functionName: string): CellValue | null {
    return this.valueCache.get(functionName) || null
  }

  public setRangeValue(functionName: string, value: CellValue) {
    this.valueCache.set(functionName, value)
  }

  public clear() {
    this.valueCache.clear()
  }

  public getStart(): SimpleCellAddress {
    return this.start
  }

  public getEnd(): SimpleCellAddress {
    return this.end
  }
}
