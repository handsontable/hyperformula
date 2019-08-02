import {EmptyCellVertex, FormulaCellVertex, MatrixVertex, RangeVertex, ValueCellVertex} from './'

/**
 * Represents vertex which keeps values of one or more cells
 */
export type CellVertex = FormulaCellVertex | ValueCellVertex | EmptyCellVertex | MatrixVertex

/**
 * Represents any vertex
 */
export type Vertex = CellVertex | RangeVertex
