import {AbsoluteCellRange} from './AbsoluteCellRange'
import {invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CrudOperations} from './CrudOperations'
import {DependencyGraph, EmptyCellVertex, FormulaCellVertex, MatrixVertex, ValueCellVertex} from './DependencyGraph'
import {ValueCellVertexValue} from './DependencyGraph/ValueCellVertex'
import {InvalidArgumentsError} from './errors'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ParserWithCaching} from './parser'

export type ClipboardCell = ClipboardCellValue | ClipboardCellFormula | ClipboardCellEmpty

enum ClipboardOperationType {
  COPY,
  CUT,
}

export enum ClipboardCellType {
  VALUE,
  EMPTY,
  FORMULA,
}

export interface ClipboardCellValue {
  type: ClipboardCellType.VALUE,
  value: ValueCellVertexValue,
}

export interface ClipboardCellEmpty {
  type: ClipboardCellType.EMPTY,
}

export interface ClipboardCellFormula {
  type: ClipboardCellType.FORMULA,
  hash: string,
}

class Clipboard {
  constructor(
    public readonly sourceLeftCorner: SimpleCellAddress,
    public readonly width: number,
    public readonly height: number,
    public readonly type: ClipboardOperationType,
    public readonly content?: ClipboardCell[][],
  ) {
  }

  public* getContent(leftCorner: SimpleCellAddress): IterableIterator<[SimpleCellAddress, ClipboardCell]> {
    if (this.content === undefined) {
      return
    } else {
      for (let y = 0; y < this.height; ++y) {
        for (let x = 0; x < this.width; ++x) {
          yield [simpleCellAddress(leftCorner.sheet, leftCorner.col + x, leftCorner.row + y), this.content[y][x]]
        }
      }
    }
  }
}

export class ClipboardOperations {
  private clipboard?: Clipboard

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly crudOperations: CrudOperations,
    private readonly parser: ParserWithCaching,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
  }

  public cut(leftCorner: SimpleCellAddress, width: number, height: number): void {
    this.clipboard = new Clipboard(leftCorner, width, height, ClipboardOperationType.CUT)
  }

  public copy(leftCorner: SimpleCellAddress, width: number, height: number): void {
    const content: ClipboardCell[][] = []

    for (let y = 0; y < height; ++y) {
      content[y] = []

      for (let x = 0; x < width; ++x) {
        const clipboardCell = this.getClipboardCell(simpleCellAddress(leftCorner.sheet, leftCorner.col + x, leftCorner.row + y))
        content[y].push(clipboardCell)
      }
    }

    this.clipboard = new Clipboard(leftCorner, width, height, ClipboardOperationType.COPY, content)
  }

  public paste(destinationLeftCorner: SimpleCellAddress): void {
    if (this.clipboard === undefined) {
      return
    }

    switch (this.clipboard.type) {
      case ClipboardOperationType.COPY: {
        this.ensureItIsPossibleToCopyPaste(destinationLeftCorner)
        const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, this.clipboard.width, this.clipboard.height)
        this.dependencyGraph.breakNumericMatricesInRange(targetRange)

        for (const [address, clipboardCell] of this.clipboard.getContent(destinationLeftCorner)) {
          if (clipboardCell.type === ClipboardCellType.VALUE) {
            this.crudOperations.setValueToCell(clipboardCell.value, address)
          } else if (clipboardCell.type === ClipboardCellType.EMPTY) {
            this.crudOperations.setCellEmpty(address)
          } else {
            this.crudOperations.setFormulaToCellFromCache(clipboardCell.hash, address)
          }
        }
        break
      }
      case ClipboardOperationType.CUT: {
        this.crudOperations.moveCells(this.clipboard.sourceLeftCorner, this.clipboard.width, this.clipboard.height, destinationLeftCorner)
      }
    }
  }

  public abortCut(): void {
    if (this.clipboard && this.clipboard.type === ClipboardOperationType.CUT) {
      this.clear()
    }
  }

  public clear(): void {
    this.clipboard = undefined
  }

  public ensureItIsPossibleToCopyPaste(destinationLeftCorner: SimpleCellAddress): void {
    if (this.clipboard === undefined) {
      return
    }

    if (invalidSimpleCellAddress(destinationLeftCorner) ||
      !this.dependencyGraph.sheetMapping.hasSheetWithId(destinationLeftCorner.sheet)) {
      throw new InvalidArgumentsError()
    }

    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, this.clipboard.width, this.clipboard.height)

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(targetRange)) {
      throw new Error('It is not possible to paste onto matrix')
    }
  }

  private getClipboardCell(address: SimpleCellAddress): ClipboardCell {
    const vertex = this.dependencyGraph.getCell(address)

    if (vertex === null || vertex instanceof EmptyCellVertex) {
      return { type: ClipboardCellType.EMPTY }
    } else if (vertex instanceof ValueCellVertex) {
      /* TODO should we copy errors? */
      return { type: ClipboardCellType.VALUE, value: vertex.getCellValue() }
    } else if (vertex instanceof MatrixVertex) {
      return { type: ClipboardCellType.VALUE, value: vertex.getMatrixCellValue(address) }
    } else if (vertex instanceof FormulaCellVertex) {
      return { type: ClipboardCellType.FORMULA, hash: this.parser.computeHashFromAst(vertex.getFormula(this.lazilyTransformingAstService)) }
    }

    throw Error('Trying to copy unsupported type')
  }
}
