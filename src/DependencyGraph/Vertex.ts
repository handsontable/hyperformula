import {FormulaCellVertex, EmptyCellVertex, MatrixVertex, ValueCellVertex, RangeVertex} from './'

/**
 * Represents vertex which keeps values of one or more cells
 */
export type CellVertex = FormulaCellVertex | ValueCellVertex | EmptyCellVertex | MatrixVertex

/**
 * Represents any vertex
 */
export type Vertex = CellVertex | RangeVertex
