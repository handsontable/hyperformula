import {Ast, ParserWithCaching} from "./parser";
import {Statistics, StatType} from "./statistics/Statistics";
import {SimpleCellAddress} from "./Cell";
import {AddColumnsDependencyTransformer} from "./dependencyTransformers/addColumns";
import {AddRowsDependencyTransformer} from "./dependencyTransformers/addRows";
import {RemoveColumnsDependencyTransformer} from "./dependencyTransformers/removeColumns";
import {RemoveRowsDependencyTransformer} from "./dependencyTransformers/removeRows";
import {AbsoluteCellRange} from "./AbsoluteCellRange";
import {MoveCellsDependencyTransformer} from "./dependencyTransformers/moveCells";
import {transformCellRangeByReferences} from "./dependencyTransformers/common";
import {ColumnsSpan} from './ColumnsSpan'
import {RowsSpan} from './RowsSpan'

export enum TransformationType {
  ADD_ROWS,
  ADD_COLUMNS,
  REMOVE_ROWS,
  REMOVE_COLUMNS,
  MOVE_CELLS,
}

export interface AddColumnsTransformation {
  type: TransformationType.ADD_COLUMNS,
  addedColumns: ColumnsSpan,
}

export interface AddRowsTransformation {
  type: TransformationType.ADD_ROWS,
  sheet: number,
  row: number,
  numberOfRowsToAdd: number,
}

export interface RemoveRowsTransformation {
  type: TransformationType.REMOVE_ROWS,
  removedRows: RowsSpan,
}

export interface RemoveColumnsTransformation {
  type: TransformationType.REMOVE_COLUMNS,
  columnsSpan: ColumnsSpan,
}

export interface MoveCellsTransformation {
  type: TransformationType.MOVE_CELLS,
  sourceRange: AbsoluteCellRange,
  toRight: number,
  toBottom: number,
  toSheet: number
}

export type Transformation =
    AddRowsTransformation
    | AddColumnsTransformation
    | RemoveRowsTransformation
    | RemoveColumnsTransformation
    | MoveCellsTransformation

export class LazilyTransformingAstService {
  private transformations: Transformation[] = []

  public parser?: ParserWithCaching

  constructor(
      private readonly stats: Statistics
  ) {
  }

  public version(): number {
    return this.transformations.length
  }

  public addAddColumnsTransformation(addedColumns: ColumnsSpan) {
    this.transformations.push({ type: TransformationType.ADD_COLUMNS, addedColumns })
  }

  public addAddRowsTransformation(sheet: number, row: number, numberOfRowsToAdd: number) {
    this.transformations.push({
      type: TransformationType.ADD_ROWS,
      sheet,
      row,
      numberOfRowsToAdd,
    })
  }

  public addRemoveRowsTransformation(removedRows: RowsSpan) {
    this.transformations.push({ type: TransformationType.REMOVE_ROWS, removedRows })
  }

  public addRemoveColumnsTransformation(columnsSpan: ColumnsSpan) {
    this.transformations.push({ type: TransformationType.REMOVE_COLUMNS, columnsSpan })
  }

  public addMoveCellsTransformation(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    this.transformations.push({
      type: TransformationType.MOVE_CELLS,
      sourceRange,
      toRight,
      toBottom,
      toSheet
    })
  }

  public applyTransformations(ast: Ast, address: SimpleCellAddress, version: number): [Ast, SimpleCellAddress, number] {
    this.stats.start(StatType.TRANSFORM_ASTS_POSTPONED)

    for (let v = version; v < this.transformations.length; v++) {
      const transformation = this.transformations[v]
      switch (transformation.type) {
        case TransformationType.ADD_COLUMNS: {
          const [newAst, newAddress] = AddColumnsDependencyTransformer.transform2(transformation.addedColumns, ast, address)
          ast = newAst
          address = newAddress
          break;
        }
        case TransformationType.ADD_ROWS: {
          const [newAst, newAddress] = AddRowsDependencyTransformer.transform2(
              transformation.sheet,
              transformation.row,
              transformation.numberOfRowsToAdd,
              ast,
              address,
          )
          ast = newAst
          address = newAddress
          break;
        }
        case TransformationType.REMOVE_COLUMNS: {
          const [newAst, newAddress] = RemoveColumnsDependencyTransformer.transform2(transformation.columnsSpan, ast, address)
          ast = newAst
          address = newAddress
          break;
        }
        case TransformationType.REMOVE_ROWS: {
          const [newAst, newAddress] = RemoveRowsDependencyTransformer.transform2(transformation.removedRows, ast, address)
          ast = newAst
          address = newAddress
          break;
        }
        case TransformationType.MOVE_CELLS: {
          const [newAst, newAddress] = MoveCellsDependencyTransformer.transform2(transformation, ast, address)
          ast = newAst
          address = newAddress
          break;
        }
      }
    }
    const cachedAst = this.parser!.rememberNewAst(ast)

    this.stats.end(StatType.TRANSFORM_ASTS_POSTPONED)
    return [cachedAst, address, this.transformations.length]
  }
}
