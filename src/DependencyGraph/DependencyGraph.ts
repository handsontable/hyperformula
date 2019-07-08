import {AddressMapping} from './AddressMapping'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {simpleCellAddress, SimpleCellAddress} from '../Cell'
import {CellDependency} from '../CellDependency'
import {findSmallerRange} from '../interpreter/plugin/SumprodPlugin'
import {Graph} from './Graph'
import {Ast, CellAddress, collectDependencies, absolutizeDependencies} from '../parser'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import assert from 'assert';
import {
  CellVertex,
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex,
  RangeVertex,
  ValueCellVertex,
  Vertex
} from './Vertex'

export class DependencyGraph {
  public recentlyChangedVertices: Set<Vertex> = new Set()

  constructor(
    private readonly addressMapping: AddressMapping,
    private readonly rangeMapping: RangeMapping,
    private readonly graph: Graph<Vertex>,
    private readonly sheetMapping: SheetMapping,
  ) {
  }

  public setFormulaToCell(address: SimpleCellAddress, ast: Ast, dependencies: CellDependency[]) {
    const vertex = this.addressMapping.getCell(address)
    this.removeIncomingEdgesIfFormulaVertex(vertex)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    if (vertex instanceof FormulaCellVertex) {
      vertex.setFormula(ast)
      this.processCellDependencies(dependencies, vertex)
      this.recentlyChangedVertices.add(vertex)
    } else {
      const newVertex = new FormulaCellVertex(ast, address)
      this.graph.exchangeOrAddNode(vertex, newVertex)
      this.addressMapping.setCell(address, newVertex)
      this.processCellDependencies(dependencies, newVertex)
      this.recentlyChangedVertices.add(newVertex)
    }
  }

  public setValueToCell(address: SimpleCellAddress, newValue: number | string) {
    const vertex = this.addressMapping.getCell(address)
    this.removeIncomingEdgesIfFormulaVertex(vertex)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    if (vertex instanceof ValueCellVertex) {
      vertex.setCellValue(newValue)
      this.recentlyChangedVertices.add(vertex)
    } else {
      const newVertex = new ValueCellVertex(newValue)
      this.graph.exchangeOrAddNode(vertex, newVertex)
      this.addressMapping!.setCell(address, newVertex)
      this.recentlyChangedVertices.add(newVertex)
    }
  }

  public setCellEmpty(address: SimpleCellAddress) {
    const vertex = this.addressMapping.getCell(address)
    this.removeIncomingEdgesIfFormulaVertex(vertex)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    if (vertex instanceof FormulaCellVertex || vertex instanceof ValueCellVertex) {
      this.graph.exchangeNode(vertex, EmptyCellVertex.getSingletonInstance())
      this.addressMapping!.removeCell(address)
      this.recentlyChangedVertices.add(EmptyCellVertex.getSingletonInstance())
    }
  }

  public ensureThatVertexIsNonMatrixCellVertex(vertex: CellVertex | null) {
    assert.ok(!(vertex instanceof MatrixVertex), `Illegal operation`)
  }

  public removeIncomingEdgesIfFormulaVertex(vertex: CellVertex | null) {
    if (vertex instanceof FormulaCellVertex) {
      this.removeIncomingEdgesFromFormulaVertex(vertex)
    }
  }

  public clearRecentlyChangedVertices() {
    this.recentlyChangedVertices = new Set()
  }

  public processCellDependencies(cellDependencies: CellDependency[], endVertex: Vertex) {
    cellDependencies.forEach((absStartCell: CellDependency) => {
      if (absStartCell instanceof AbsoluteCellRange) {
        const range = absStartCell
        let rangeVertex = this.rangeMapping.getRange(range.start, range.end)
        if (rangeVertex === null) {
          rangeVertex = new RangeVertex(range)
          this.rangeMapping.setRange(rangeVertex)
        }

        this.graph.addNode(rangeVertex)

        const {smallerRangeVertex, restRanges} = findSmallerRange(this.rangeMapping, [range])
        const restRange = restRanges[0]
        if (smallerRangeVertex) {
          this.graph.addEdge(smallerRangeVertex, rangeVertex)
        }

        const matrix = this.addressMapping.getMatrix(restRange)
        if (matrix !== undefined) {
          this.graph.addEdge(matrix, rangeVertex)
        } else {
          for (const cellFromRange of restRange.generateCellsFromRangeGenerator()) {
            this.graph.addEdge(this.fetchOrCreateEmptyCell(cellFromRange), rangeVertex)
          }
        }
        this.graph.addEdge(rangeVertex, endVertex)
      } else {
        this.graph.addEdge(this.fetchOrCreateEmptyCell(absStartCell), endVertex)
      }
    })
  }

  public removeIncomingEdgesFromFormulaVertex(vertex: FormulaCellVertex) {
    const deps: (CellAddress | [CellAddress, CellAddress])[] = []
    collectDependencies(vertex.getFormula(), deps)
    const absoluteDeps = absolutizeDependencies(deps, vertex.getAddress())
    const verticesForDeps = new Set(absoluteDeps.map((dep: CellDependency) => {
      if (dep instanceof AbsoluteCellRange) {
        return this.rangeMapping!.getRange(dep.start, dep.end)!
      } else {
        return this.addressMapping!.fetchCell(dep)
      }
    }))
    this.graph.removeIncomingEdgesFrom(verticesForDeps, vertex)
  }

  public fetchOrCreateEmptyCell(address: SimpleCellAddress): CellVertex {
    let vertex = this.addressMapping.getCell(address)
    if (!vertex) {
      vertex = new EmptyCellVertex()
      this.graph.addNode(vertex)
      this.addressMapping.setCell(address, vertex)
    }
    return vertex
  }

  public removeRows(sheet: number, rowStart: number, rowEnd: number) {
    if (this.addressMapping!.isFormulaMatrixInRows(sheet, rowStart, rowEnd)) {
      throw Error("It is not possible to remove row with matrix")
    }

    for (let x=0; x<this.addressMapping.getWidth(sheet); ++x) {
      for (let y = rowStart; y <= rowEnd; ++y) {
        const address = simpleCellAddress(sheet, x, y)
        const vertex = this.addressMapping.getCell(address)
        if (vertex instanceof MatrixVertex || vertex === null) {
          continue
        }
        this.graph.removeNode(vertex)
        this.recentlyChangedVertices.add(EmptyCellVertex.getSingletonInstance())
      }
    }

    for (let matrix of this.addressMapping!.numericMatricesInRows(sheet, rowStart, rowEnd)) {
      matrix.removeRows(sheet, rowStart, rowEnd)
      if (matrix.height === 0) {
        this.graph.removeNode(matrix)
      }
    }

    this.addressMapping!.removeRows(sheet, rowStart, rowEnd)

    const rangesToRemove = this.rangeMapping.truncateRanges(sheet, rowStart, rowEnd)

    rangesToRemove.forEach(vertex => {
      this.graph.removeNode(vertex)
    })
  }

  public removeColumns(sheet: number, columnStart: number, columnEnd: number) {
    if (this.addressMapping!.isFormulaMatrixInColumns(sheet, columnStart, columnEnd)) {
      throw Error("It is not possible to remove column within matrix")
    }

    for (let y=0; y<this.addressMapping.getHeight(sheet); ++y) {
      for (let x = columnStart; x <= columnEnd; ++x) {
        const address = simpleCellAddress(sheet, x, y)
        const vertex = this.addressMapping.getCell(address)
        if (vertex instanceof MatrixVertex || vertex === null) {
          continue
        }
        this.graph.removeNode(vertex)
      }
    }
  }

  public addRows(sheet: number, rowStart: number, numberOfRows: number) {
    if (this.addressMapping!.isFormulaMatrixInRows(sheet, rowStart)) {
      throw Error("It is not possible to add row in row with matrix")
    }

    this.addressMapping!.addRows(sheet, rowStart, numberOfRows)

    for (let matrix of this.addressMapping!.numericMatricesInRows(sheet, rowStart)) {
      matrix.addRows(sheet, rowStart, numberOfRows)
    }

    this.fixRanges(sheet, rowStart, numberOfRows)
  }

  private fixRanges(sheet: number, row: number, numberOfRows: number) {
    for (const range of this.rangeMapping.getValues()) {
      if (range.sheet === sheet && range.start.row < row && range.end.row >= row) {
        const anyVertexInRow = this.addressMapping!.getCell(simpleCellAddress(sheet, range.start.col, row + numberOfRows))!
        if (this.graph.adjacentNodes(anyVertexInRow).has(range)) {
          for (let y = row; y < row + numberOfRows; ++y) {
            for (let x = range.start.col; x <= range.end.col; ++x) {
              this.graph.addEdge(this.fetchOrCreateEmptyCell(simpleCellAddress(sheet, x, y)), range)
            }
          }
        }
      }
    }

    this.rangeMapping.shiftRanges(sheet, row, numberOfRows)
  }

  public fixRangesWhenAddingColumns(sheet: number, column: number, numberOfColumns: number) {
    for (const range of this.rangeMapping.getValues()) {
      if (range.sheet === sheet && range.start.col < column && range.end.col >= column) {
        const anyVertexInColumn = this.addressMapping.fetchCell(simpleCellAddress(sheet, column + numberOfColumns, range.start.row))
        if (this.graph.adjacentNodes(anyVertexInColumn).has(range)) {
          for (let y = column; y < column + numberOfColumns; ++y) {
            for (let x = range.start.col; x <= range.end.col; ++x) {
              this.graph.addEdge(this.fetchOrCreateEmptyCell(simpleCellAddress(sheet, y, x)), range)
            }
          }
        }
      }
    }

    this.rangeMapping.shiftRangesColumns(sheet, column, numberOfColumns)
  }
}
