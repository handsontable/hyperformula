import {AbsoluteCellRange} from './AbsoluteCellRange'
import {invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CrudOperations} from './CrudOperations'
import {DependencyGraph, EmptyCellVertex, FormulaCellVertex, MatrixVertex, ValueCellVertex} from './DependencyGraph'
import {ValueCellVertexValue} from './DependencyGraph/ValueCellVertex'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ParserWithCaching} from './parser'

type ClipboardCell = ClipboardCellValue | ClipboardCellFormula | ClipboardCellEmpty

enum ClipboardCellType {
  VALUE,
  EMPTY,
  FORMULA
}

interface ClipboardCellValue {
  type: ClipboardCellType.VALUE,
  value: ValueCellVertexValue
}

interface ClipboardCellEmpty {
  type: ClipboardCellType.EMPTY,
}

interface ClipboardCellFormula {
  type: ClipboardCellType.FORMULA
  hash: string
}

class CopyPasteClipboard {
  constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly content: ClipboardCell[][]
  ) {
  }

  public* getContent(leftCorner: SimpleCellAddress): IterableIterator<[SimpleCellAddress, ClipboardCell]> {
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        yield [simpleCellAddress(leftCorner.sheet, leftCorner.col + x, leftCorner.row + y), this.content[y][x]]
      }
    }
  }
}

export class CopyPaste {
  private clipboard?: CopyPasteClipboard

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly crudOperations: CrudOperations,
    private readonly parser: ParserWithCaching,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService
  ) {
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

    this.clipboard = new CopyPasteClipboard(width, height, content)
  }

  public paste(destinationLeftCorner: SimpleCellAddress) {
    this.ensureItIsPossibleToPaste(destinationLeftCorner)

    if (this.clipboard === undefined) {
      return
    }

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
  }

  public ensureItIsPossibleToPaste(destinationLeftCorner: SimpleCellAddress): void {
    if (this.clipboard === undefined) {
      return
    }

    if (invalidSimpleCellAddress(destinationLeftCorner) ||
      !this.dependencyGraph.sheetMapping.hasSheetWithId(destinationLeftCorner.sheet)) {
      throw new Error('Invalid arguments')
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

    throw Error("Trying to copy unsupported type")
  }
}
