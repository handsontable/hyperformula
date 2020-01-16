import {CellValue, EmptyValue, EmptyValueType, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CrudOperations} from './CrudOperations'
import {CellVertex, DependencyGraph, FormulaCellVertex, ValueCellVertex} from './DependencyGraph'
import {ValueCellVertexValue} from './DependencyGraph/ValueCellVertex'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Ast, AstNodeType, ParserWithCaching} from './parser'
import {ParsingResult} from './parser/ParserWithCaching'

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
        const vertex = this.dependencyGraph.getCell(simpleCellAddress(leftCorner.sheet, leftCorner.col + x, leftCorner.row + y))
        const clipboardCell = this.getClipboardCell(vertex)
        content[y].push(clipboardCell)
      }
    }

    this.clipboard = new CopyPasteClipboard(width, height, content)
  }

  public paste(leftCorner: SimpleCellAddress) {
    if (this.clipboard === undefined) {
      return
    }

    for (const [address, clipboardCell] of this.clipboard.getContent(leftCorner)) {
      if (clipboardCell.type === ClipboardCellType.VALUE) {
        this.crudOperations.setValueToCell(clipboardCell.value, address)
      } else if (clipboardCell.type === ClipboardCellType.EMPTY) {
        this.crudOperations.setCellEmpty(address)
      } else {
        this.crudOperations.setFormulaToCellFromCache(clipboardCell.hash, address)
      }
    }
  }

  private getClipboardCell(vertex: CellVertex | null): ClipboardCell {
    if (vertex === null) {
      return { type: ClipboardCellType.EMPTY }
    }
    if (vertex instanceof ValueCellVertex) {
      /* TODO should we copy errors? */
      return { type: ClipboardCellType.VALUE, value: vertex.getCellValue() }
    }
    if (vertex instanceof FormulaCellVertex) {
      return { type: ClipboardCellType.FORMULA, hash: this.parser.computeHashFromAst(vertex.getFormula(this.lazilyTransformingAstService)) }
    }

    throw Error("Trying to copy unsupported type")
  }
}
