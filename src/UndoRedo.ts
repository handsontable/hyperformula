import {SimpleCellAddress} from './Cell'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {Operations, RowsRemoval, RemoveRowsCommand, RowsAddition} from './Operations'
import {CrudOperations} from './CrudOperations'
import {Index} from './HyperFormula'

export class UndoRedo {

  constructor() {
  }

  public readonly undoStack: ({
    type: 'remove-rows',
    sheet: number,
    rowsRemovals: RowsRemoval[],
  } | {
    type: 'add-rows',
    sheet: number,
    rowsAdditions: RowsAddition[],
  })[] = []
  public crudOperations?: CrudOperations

  public oldData: Map<number, [SimpleCellAddress, string][]> = new Map()

  public saveOperationRemoveRows(removeRowsCommand: RemoveRowsCommand, rowsRemovals: RowsRemoval[]) {
    this.undoStack.push({ type: 'remove-rows', sheet: removeRowsCommand.sheet, rowsRemovals })
  }

  public saveOperationAddRows(sheet: number, rowsAdditions: RowsAddition[]) {
    this.undoStack.push({ type: 'add-rows', sheet: sheet, rowsAdditions })
  }

  public storeDataForVersion(version: number, address: SimpleCellAddress, astHash: string) {
    if (!this.oldData.has(version)) {
      this.oldData.set(version, [])
    }
    const currentOldData = this.oldData.get(version)!
    currentOldData.push([address, astHash])
  }

  public undo() {
    const operation = this.undoStack.pop()!

    if (operation.type === "remove-rows") {
      const { sheet, rowsRemovals } = operation
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
    } else {
      const { sheet, rowsAdditions } = operation
      for (let i = rowsAdditions.length - 1; i >= 0; --i) {
        const rowsAddition = rowsAdditions[i]
        this.crudOperations!.operations.removeRows(new RemoveRowsCommand(sheet, [[rowsAddition.afterRow, rowsAddition.rowCount]]))
      }
    }
  }
}
