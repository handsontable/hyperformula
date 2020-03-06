import {SimpleCellAddress} from './Cell'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {CrudOperations, RowsRemoval} from './CrudOperations'
import {Index} from './HyperFormula'

export class UndoRedo {

  constructor() {
  }

  public readonly undoStack: {
    sheet: number,
    rowsRemovals: RowsRemoval[],
  }[] = []
  public crudOperations?: CrudOperations

  public oldData: Map<number, [SimpleCellAddress, string][]> = new Map()

  public saveOperationRemoveRows(sheet: number, rowsRemovals: RowsRemoval[]) {
    this.undoStack.push({ sheet, rowsRemovals })
  }

  public storeDataForVersion(version: number, address: SimpleCellAddress, astHash: string) {
    if (!this.oldData.has(version)) {
      this.oldData.set(version, [])
    }
    const currentOldData = this.oldData.get(version)!
    currentOldData.push([address, astHash])
  }

  public undo() {
    const { sheet, rowsRemovals } = this.undoStack.pop()!
    for (let i = rowsRemovals.length - 1; i >= 0; --i) {
      const rowsRemoval = rowsRemovals[i]
      this.crudOperations!.reallyDoAddRows(sheet, [[rowsRemoval.rowFrom, rowsRemoval.rowCount]])

      for (let { address, cellType } of rowsRemoval.removedCells) {
        switch (cellType.type) {
          case ClipboardCellType.VALUE: {
            this.crudOperations?.setValueToCell(cellType.value, address)
            break
          }
          case ClipboardCellType.FORMULA: {
            this.crudOperations?.setFormulaToCellFromCache(cellType.hash, address)
            break
          }
        }
      }

      const oldDataToRestore = this.oldData.get(rowsRemoval.version - 1) || []
      for (const entryToRestore of oldDataToRestore) {
        const [ address, hash ] = entryToRestore
        this.crudOperations!.setFormulaToCellFromCache(hash, address)
      }
    }
  }
}
