import {SimpleCellAddress} from './Cell'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {CrudOperations} from './CrudOperations'
import {Index} from './HyperFormula'

export class UndoRedo {

  constructor() {
  }

  public readonly undoStack: {
    sheet: number,
    indexes: Index[],
    versions: [number, [SimpleCellAddress, ClipboardCell][]][]
  }[] = []
  public crudOperations?: CrudOperations

  public oldData: Map<number, [SimpleCellAddress, string][]> = new Map()

  public saveOperationRemoveRows(sheet: number, indexes: Index[], versions: [number, [SimpleCellAddress, ClipboardCell][]][]) {
    this.undoStack.push({ sheet, indexes, versions })
  }

  public storeDataForVersion(version: number, address: SimpleCellAddress, astHash: string) {
    if (!this.oldData.has(version)) {
      this.oldData.set(version, [])
    }
    const currentOldData = this.oldData.get(version)!
    currentOldData.push([address, astHash])
  }

  public undo() {
    const { sheet, indexes, versions } = this.undoStack.pop()!
    for (let i = indexes.length - 1; i >= 0; --i) {
      const index = indexes[i]
      const [version, vertices] = versions[i]
      this.crudOperations!.addRows(sheet, index)

      for (let [address, vertex] of vertices) {
        switch (vertex.type) {
          case ClipboardCellType.VALUE: {
            this.crudOperations?.setValueToCell(vertex.value, address)
            break
          }
          case ClipboardCellType.FORMULA: {
            this.crudOperations?.setFormulaToCellFromCache(vertex.hash, address)
            break
          }
        }
      }

      const oldDataToRestore = this.oldData.get(version - 1) || []
      for (const entryToRestore of oldDataToRestore) {
        const [ address, hash ] = entryToRestore
        this.crudOperations!.setFormulaToCellFromCache(hash, address)
      }
    }
  }
}
