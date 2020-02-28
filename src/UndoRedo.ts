import {Index} from './HyperFormula'
import {Ast, ParserWithCaching} from './parser'
import {SimpleCellAddress} from './Cell'
import {CrudOperations} from './CrudOperations'
import {
  AddressMapping,
  DependencyGraph,
  FormulaCellVertex,
  Graph,
  MatrixMapping,
  MatrixVertex,
  RangeMapping,
  SheetMapping,
  SparseStrategy,
  Vertex,
} from './DependencyGraph'

export class UndoRedo {
  public readonly undoStack: any[] = []
  public parser?: ParserWithCaching
  public crudOperations?: CrudOperations

  constructor(
  ) {
  }

  public saveOperationRemoveRows(sheet: number, indexes: Index[], versions: [number, Vertex[]][]) {
    this.undoStack.push({ sheet, indexes, versions })
  }

  public storeDataForVersion(version: number, address: SimpleCellAddress, ast: Ast) {
  }

  public undo() {
    const { sheet, indexes, versions } = this.undoStack.pop()
    for (let i = indexes.length - 1; i >= 0; --i) {
      this.crudOperations!.addRows(sheet, indexes[i])
    }
  }
}
