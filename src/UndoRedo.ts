import {SimpleCellAddress} from './Cell'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {Operations, RowsRemoval, RemoveRowsCommand, RowsAddition, AddRowsCommand} from './Operations'
import {CrudOperations} from './CrudOperations'
import {Index} from './HyperFormula'

enum UndoStackElementType {
  REMOVE_ROWS = 'REMOVE_ROWS',
  ADD_ROWS = 'ADD_ROWS',
}

interface RemoveRowsUndoData {
  type: UndoStackElementType.REMOVE_ROWS,
  sheet: number,
  rowsRemovals: RowsRemoval[],
}

interface AddRowsUndoData {
  type: UndoStackElementType.ADD_ROWS,
  sheet: number,
  rowsAdditions: RowsAddition[],
}

type UndoStackElement
  = RemoveRowsUndoData
  | AddRowsUndoData

export class UndoRedo {

  constructor() {
  }

  public readonly undoStack: UndoStackElement[] = []
  public crudOperations?: CrudOperations

  public oldData: Map<number, [SimpleCellAddress, string][]> = new Map()

  public saveOperationRemoveRows(removeRowsCommand: RemoveRowsCommand, rowsRemovals: RowsRemoval[]) {
    this.undoStack.push({ type: UndoStackElementType.REMOVE_ROWS, sheet: removeRowsCommand.sheet, rowsRemovals })
  }

  public saveOperationAddRows(addRowsCommand: AddRowsCommand, rowsAdditions: RowsAddition[]) {
    this.undoStack.push({ type: UndoStackElementType.ADD_ROWS, sheet: addRowsCommand.sheet, rowsAdditions })
  }

  public storeDataForVersion(version: number, address: SimpleCellAddress, astHash: string) {
    if (!this.oldData.has(version)) {
      this.oldData.set(version, [])
    }
    const currentOldData = this.oldData.get(version)!
    currentOldData.push([address, astHash])
  }

  public isUndoStackEmpty(): boolean {
    return this.undoStack.length === 0
  }

  public undo() {
    const operation = this.undoStack.pop()
    if (!operation) {
      throw "Attempted to undo without operation on stack"
    }

    switch(operation.type) {
      case UndoStackElementType.REMOVE_ROWS: {
        this.undoRemoveRows(operation)
        break;
      }
      case UndoStackElementType.ADD_ROWS: {
        this.undoAddRows(operation)
        break;
      }
    }
  }

  private undoRemoveRows(operation: RemoveRowsUndoData) {
    const { sheet, rowsRemovals } = operation
    for (let i = rowsRemovals.length - 1; i >= 0; --i) {
      const rowsRemoval = rowsRemovals[i]
      this.crudOperations!.operations.addRows(new AddRowsCommand(sheet, [[rowsRemoval.rowFrom, rowsRemoval.rowCount]]))

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

  private undoAddRows(operation: AddRowsUndoData) {
    const { sheet, rowsAdditions } = operation
    for (let i = rowsAdditions.length - 1; i >= 0; --i) {
      const rowsAddition = rowsAdditions[i]
      this.crudOperations!.operations.removeRows(new RemoveRowsCommand(sheet, [[rowsAddition.afterRow, rowsAddition.rowCount]]))
    }
  }
}
