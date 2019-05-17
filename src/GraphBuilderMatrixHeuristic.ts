import {AbsoluteCellRange} from './AbsoluteCellRange'
import {AddressMapping} from './AddressMapping'
import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellAddress, CellReferenceType} from './CellAddress'
import {CellDependency} from './CellDependency'
import {Config} from './Config'
import {Graph} from './Graph'
import {Size} from './Matrix'
import {AstNodeType, buildCellRangeAst, buildProcedureAst, CellRangeAst, ProcedureAst} from './parser'
import {FormulaCellVertex, MatrixVertex, ValueCellVertex, Vertex} from './Vertex'
import {Sheets} from "./GraphBuilder";
import {SheetMapping} from "./SheetMapping";

export class Array2d<T> {

  public static fromArray<T>(input: T[][]): Array2d<T> {
    const size: Size = {width: input[0].length, height: input.length}
    const array = new Array2d<T>(size)
    for (let i = 0; i < size.height; ++i) {
      for (let j = 0; j < size.width; ++j) {
        array.set(j, i, input[i][j])
      }
    }
    return array
  }

  private readonly _size: Size
  private readonly array: T[][]

  constructor(size: Size) {
    this._size = size
    this.array = new Array(size.height)
    for (let y = 0; y < size.height; ++y) {
      this.array[y] = new Array(size.width)
    }
  }

  public set(x: number, y: number, value: T) {
    this.array[y][x] = value
  }

  public get(x: number, y: number): T | null {
    const row = this.array[y]
    if (!row) {
      return null
    }
    return row[x] || null
  }

  public size() {
    return this._size
  }
}

export class GraphBuilderMatrixHeuristic {

  private mapping: Map<number, Array2d<string>> = new Map()

  constructor(
      private readonly graph: Graph<Vertex>,
      private readonly addressMapping: AddressMapping,
      private readonly dependencies: Map<Vertex, CellDependency[]>,
      private readonly config: Config,
  ) {
  }

  public addSheet(id: number, size: Size) {
    if (!this.config.matrixDetection) {
      return
    }

    this.mapping.set(id, new Array2d<string>(size))
  }

  public add(hash: string, cellAddress: SimpleCellAddress) {
    if (!this.config.matrixDetection) {
      return
    }

    if (!this.mapping.has(cellAddress.sheet)) {
      throw Error(`Sheet with id: ${cellAddress.sheet} does not exists`)
    }
    this.mapping.get(cellAddress.sheet)!.set(cellAddress.col, cellAddress.row, hash)
  }

  public run(sheets: Sheets, sheetMapping: SheetMapping) {
    if (!this.config.matrixDetection) {
      return
    }

    const scanResult = this.findMatrices()
    scanResult.forEach((elem) => {
      const hash = elem[0]
      const possibleMatrix = elem[1]


      if (hash === '#') {
          const matrixVertex = MatrixVertex.fromRange(possibleMatrix)
          matrixVertex.setCellValue(possibleMatrix.matrixFromPlainValues(sheets, sheetMapping))
          for (const address of possibleMatrix.generateCellsFromRangeGenerator()) {
            this.addressMapping.setCell(address, matrixVertex)
            this.addressMapping.setMatrix(possibleMatrix, matrixVertex)
          }
          this.graph.addNode(matrixVertex)
      } else {
        const leftCorner = this.addressMapping.getCell(possibleMatrix.start)
        if (leftCorner instanceof FormulaCellVertex) {
          const output = this.ifMatrixCompatibile(leftCorner, possibleMatrix.width(), possibleMatrix.height())
          if (output) {
            const {leftMatrix, rightMatrix} = output
            const newAst = buildMultAst(leftMatrix, rightMatrix)
            const matrixVertex = MatrixVertex.fromRange(possibleMatrix, newAst)
            const matrixDependencies = this.dependencies.get(leftCorner)!

            for (const address of possibleMatrix.generateCellsFromRangeGenerator()) {
              const vertex = this.addressMapping.getCell(address)
              const deps = this.dependencies.get(vertex)!
              matrixDependencies.push(...deps)
              this.addressMapping.setCell(address, matrixVertex)
              this.addressMapping.setMatrix(possibleMatrix, matrixVertex)
              this.dependencies.delete(vertex)
              this.graph.removeNode(vertex)
            }

            this.graph.addNode(matrixVertex)
          }
        }
      }
    })
    this.mapping.clear()
  }

  private findMatrices(): [string, AbsoluteCellRange][] {
    let result: [string, AbsoluteCellRange][] = []
    this.mapping.forEach((m, sheet) => {
      result = result.concat(findMatrices(sheet, m))
    })
    return result
  }

  private ifMatrixCompatibile(leftCorner: FormulaCellVertex, width: number, height: number): ({ leftMatrix: AbsoluteCellRange, rightMatrix: AbsoluteCellRange }) | false {
    const formula = leftCorner.getFormula()

    if (formula.type === AstNodeType.FUNCTION_CALL && formula.procedureName === 'SUMPROD') {
      if (formula.args.length !== 2) {
        return false
      }

      const [leftArg, rightArg] = formula.args
      let leftRange, rightRange

      if (leftArg.type === AstNodeType.CELL_RANGE && rightArg.type === AstNodeType.FUNCTION_CALL && rightArg.procedureName === 'TRANSPOSE') {
        leftRange = leftArg
        rightRange = rightArg.args[0] as CellRangeAst
      } else if (rightArg.type === AstNodeType.CELL_RANGE && leftArg.type === AstNodeType.FUNCTION_CALL && leftArg.procedureName === 'TRANSPOSE') {
        leftRange = leftArg.args[0] as CellRangeAst
        rightRange = rightArg
      } else {
        return false
      }

      if (leftRange.start.type !== CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL
          || leftRange.end.type !== CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL
          || rightRange.start.type !== CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW
          || rightRange.end.type !== CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW) {
        return false
      }

      const leftArgRange = AbsoluteCellRange.fromCellRange(leftRange, leftCorner.getAddress())
      const rightArgRange = AbsoluteCellRange.fromCellRange(rightRange, leftCorner.getAddress())

      if (leftArgRange.height() === 1 && rightArgRange.width() === 1 && leftArgRange.width() === rightArgRange.height()) {
        const leftMatrix = leftArgRange.withEnd(simpleCellAddress(leftArgRange.start.sheet, leftArgRange.end.col, leftArgRange.end.row + height - 1))
        const rightMatrix = rightArgRange.withEnd(simpleCellAddress(rightArgRange.start.sheet, rightArgRange.end.col + width - 1, rightArgRange.end.row))
        const currentMatrix = AbsoluteCellRange.spanFrom(leftCorner.getAddress(), width, height)

        if (!leftMatrix.doesOverlap(currentMatrix) && !rightMatrix.doesOverlap(currentMatrix)) {
          return {leftMatrix, rightMatrix}
        }
      }
    }

    return false
  }
}

export function buildMultAst(leftMatrix: AbsoluteCellRange, rightMatrix: AbsoluteCellRange): ProcedureAst {
  return buildProcedureAst('MMULT', [
    buildCellRangeAst(
        CellAddress.absolute(leftMatrix.start.sheet, leftMatrix.start.col, leftMatrix.start.row),
        CellAddress.absolute(leftMatrix.end.sheet, leftMatrix.end.col, leftMatrix.end.row),
    ),
    buildCellRangeAst(
        CellAddress.absolute(rightMatrix.start.sheet, rightMatrix.start.col, rightMatrix.start.row),
        CellAddress.absolute(rightMatrix.end.sheet, rightMatrix.end.col, rightMatrix.end.row),
    ),
  ])
}

export function findMatrices(sheet: number, input: Array2d<string>): [string, AbsoluteCellRange][] {
  const size = input.size()
  const result = new Map<number, [string, AbsoluteCellRange]>()
  const colours = new Array2d<number>(size)
  let colour = 0

  for (let y = size.height - 1; y >= 0; --y) {
    for (let x = size.width - 1; x >= 0; --x) {
      const value = input.get(x, y)

      const [right, rightColour] = [input.get(x + 1, y)!, colours.get(x + 1, y)!]
      const [bottom, bottomColour] = [input.get(x, y + 1)!, colours.get(x, y + 1)!]
      const [diag, diagColour] = [input.get(x + 1, y + 1)!, colours.get(x + 1, y + 1)!]

      if (value === null) {
        colours.set(x, y, 0)
        if (rightColour === bottomColour) {
          // 0 1
          // 1 *
          result.delete(rightColour)
        }
      } else if (value !== right && rightColour === bottomColour) {
        // 1 2
        // 2 *
        colours.set(x, y, ++colour)
        result.set(colour, [value, AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y)])
        result.delete(rightColour!)
      } else if (value !== diag) {
        if (right === value && right === bottom) {
          // 1 1
          // 1 0
          result.delete(rightColour!)
          result.delete(bottomColour!)
          colours.set(x, y, ++colour)
          result.set(colour, [value, AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y)])
        } else if (right !== value && bottom === value) {
          // 1 0
          // 1 0
          if (result.has(bottomColour)) {
            colours.set(x, y, bottomColour)
            const range = result.get(bottomColour)![1].withStart(simpleCellAddress(sheet, x, y))
            result.set(bottomColour, [value, range])
          } else {
            colours.set(x, y, ++colour)
            result.set(colour, [value, AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y)])
          }
        } else if (right === value && bottom !== value) {
          // 1 1
          // 0 0
          colours.set(x, y, rightColour)
          const range = result.get(rightColour)![1].withStart(simpleCellAddress(sheet, x, y))
          result.set(rightColour, [value, range])
        } else {
          colours.set(x, y, ++colour)
          result.set(colour, [value, AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y)])
        }
      } else if (value === diag && diagColour === rightColour && diagColour === bottomColour) {
        // 1 1
        // 1 1
        colours.set(x, y, rightColour)
        const range = result.get(rightColour)![1].withStart(simpleCellAddress(sheet, x, y))
        result.set(rightColour, [value, range])
      } else if (value === diag) {
        colours.set(x, y, ++colour)
        result.set(colour, [value, AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y)])
      }
    }
  }

  const scanResult: [string, AbsoluteCellRange][] = new Array<[string, AbsoluteCellRange]>()
  result.forEach((range) => {
    // if (range[1].width() * range[1].height() > 1) {
    scanResult.push(range)
    // }
  })
  return scanResult
}
