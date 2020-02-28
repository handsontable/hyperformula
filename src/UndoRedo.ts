import {Index} from './HyperFormula'
import {Ast, ParserWithCaching} from './parser'
import {SimpleCellAddress} from './Cell'
import {CrudOperations} from './CrudOperations'
import {
  AddressMapping, CellVertex,
  DependencyGraph,
  FormulaCellVertex,
  Graph,
  MatrixMapping,
  MatrixVertex,
  RangeMapping,
  SheetMapping,
  SparseStrategy, ValueCellVertex,
  Vertex,
} from './DependencyGraph'

export class UndoRedo {
  public readonly undoStack: { sheet: number, indexes: Index[], versions: [number, [SimpleCellAddress, CellVertex][]][]}[] = []
  public parser?: ParserWithCaching
  public crudOperations?: CrudOperations

  constructor(
  ) {
  }

  public saveOperationRemoveRows(sheet: number, indexes: Index[], versions: [number, [SimpleCellAddress, CellVertex][]][]) {
    this.undoStack.push({ sheet, indexes, versions })
  }

  public storeDataForVersion(version: number, address: SimpleCellAddress, ast: Ast) {
  }

  public undo() {
    const { sheet, indexes, versions } = this.undoStack.pop()!
    for (let i = indexes.length - 1; i >= 0; --i) {
      const index = indexes[i]
      const [version, vertices] = versions[i]
      this.crudOperations!.addRows(sheet, index)

      for (let [address, vertex] of vertices) {
        if (vertex instanceof ValueCellVertex) {
          this.crudOperations?.setValueToCell(vertex.getCellValue(), address)
        }
      }
    }
  }
}
