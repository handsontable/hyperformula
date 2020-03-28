import {AbsoluteCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {ColumnsSpan} from './ColumnsSpan'
import {AddRowsDependencyTransformer} from './dependencyTransformers/addRows'
import {MoveCellsDependencyTransformer} from './dependencyTransformers/moveCells'
import {RemoveColumnsDependencyTransformer} from './dependencyTransformers/removeColumns'
import {RemoveRowsDependencyTransformer} from './dependencyTransformers/removeRows'
import {RemoveSheetDependencyTransformer} from './dependencyTransformers/removeSheet'
import {Ast, ParserWithCaching} from './parser'
import {RowsSpan} from './RowsSpan'
import {Statistics, StatType} from './statistics/Statistics'
import {UndoRedo} from './UndoRedo'
import {AddColumnsTransformer} from './dependencyTransformers/transformer'

export enum TransformationType {
  ADD_ROWS,
  ADD_COLUMNS,
  REMOVE_ROWS,
  REMOVE_COLUMNS,
  MOVE_CELLS,
  REMOVE_SHEET,
}

export interface AddColumnsTransformation {
  type: TransformationType.ADD_COLUMNS,
  addedColumns: ColumnsSpan,
  sheet: number,
}

export interface AddRowsTransformation {
  type: TransformationType.ADD_ROWS,
  addedRows: RowsSpan,
  sheet: number,
}

export interface RemoveRowsTransformation {
  type: TransformationType.REMOVE_ROWS,
  removedRows: RowsSpan,
  sheet: number,
}

export interface RemoveColumnsTransformation {
  type: TransformationType.REMOVE_COLUMNS,
  removedColumns: ColumnsSpan,
  sheet: number,
}

export interface MoveCellsTransformation {
  type: TransformationType.MOVE_CELLS,
  sourceRange: AbsoluteCellRange,
  toRight: number,
  toBottom: number,
  toSheet: number,
  sheet: number,
}

export interface RemoveSheetTransformation {
  type: TransformationType.REMOVE_SHEET,
  sheet: number,
}

export type Transformation =
    AddRowsTransformation
    | AddColumnsTransformation
    | RemoveRowsTransformation
    | RemoveColumnsTransformation
    | MoveCellsTransformation
    | RemoveSheetTransformation

export class LazilyTransformingAstService {

  public parser?: ParserWithCaching
  public undoRedo?: UndoRedo
  private transformations: Transformation[] = []

  constructor(
    private readonly stats: Statistics,
  ) {
  }

  public version(): number {
    return this.transformations.length
  }

  public addAddColumnsTransformation(addedColumns: ColumnsSpan) {
    this.transformations.push({ type: TransformationType.ADD_COLUMNS, addedColumns, sheet: addedColumns.sheet })
  }

  public addAddRowsTransformation(addedRows: RowsSpan) {
    this.transformations.push({ type: TransformationType.ADD_ROWS, addedRows, sheet: addedRows.sheet })
  }

  public addRemoveRowsTransformation(removedRows: RowsSpan): number {
    this.transformations.push({ type: TransformationType.REMOVE_ROWS, removedRows, sheet: removedRows.sheet })
    return this.version()
  }

  public addRemoveColumnsTransformation(removedColumns: ColumnsSpan) {
    this.transformations.push({ type: TransformationType.REMOVE_COLUMNS, removedColumns, sheet: removedColumns.sheet })
  }

  public addRemoveSheetTransformation(sheet: number) {
    this.transformations.push({ type: TransformationType.REMOVE_SHEET, sheet})
  }

  public addMoveCellsTransformation(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    this.transformations.push({
      type: TransformationType.MOVE_CELLS,
      sourceRange,
      toRight,
      toBottom,
      toSheet,
      sheet: sourceRange.sheet,
    })
  }

  public applyTransformations(ast: Ast, address: SimpleCellAddress, version: number): [Ast, SimpleCellAddress, number] {
    this.stats.start(StatType.TRANSFORM_ASTS_POSTPONED)

    for (let v = version; v < this.transformations.length; v++) {
      const transformation = this.transformations[v]
      switch (transformation.type) {
        case TransformationType.ADD_COLUMNS: {
          const [newAst, newAddress] = new AddColumnsTransformer(transformation.addedColumns).transformSingleAst(ast, address)
          ast = newAst
          address = newAddress
          break
        }
        case TransformationType.ADD_ROWS: {
          const [newAst, newAddress] = AddRowsDependencyTransformer.transformSingleAst(transformation.addedRows, ast, address)
          ast = newAst
          address = newAddress
          break
        }
        case TransformationType.REMOVE_COLUMNS: {
          const [newAst, newAddress] = RemoveColumnsDependencyTransformer.transformSingleAst(transformation.removedColumns, ast, address)
          ast = newAst
          address = newAddress
          break
        }
        case TransformationType.REMOVE_ROWS: {
          const [newAst, newAddress] = RemoveRowsDependencyTransformer.transformSingleAst(transformation.removedRows, ast, address)
          this.undoRedo!.storeDataForVersion(v, address, this.parser!.computeHashFromAst(ast))
          ast = newAst
          address = newAddress
          break
        }
        case TransformationType.MOVE_CELLS: {
          const [newAst, newAddress] = MoveCellsDependencyTransformer.transformSingleAst(transformation, ast, address)
          ast = newAst
          address = newAddress
          break
        }
        case TransformationType.REMOVE_SHEET: {
          ast = RemoveSheetDependencyTransformer.transformSingleAst(transformation.sheet, ast, address)
          break
        }
      }
    }
    const cachedAst = this.parser!.rememberNewAst(ast)

    this.stats.end(StatType.TRANSFORM_ASTS_POSTPONED)
    return [cachedAst, address, this.transformations.length]
  }

  public* getTransformationsFrom(version: number, filter?: (transformation: Transformation) => boolean): IterableIterator<Transformation> {
    for (let v = version; v < this.transformations.length; v++) {
      const transformation = this.transformations[v]
      if (!filter || filter(transformation)) {
        yield transformation
      }
    }
  }

  public destroy() {
    this.parser = undefined
    this.transformations = []
  }
}
