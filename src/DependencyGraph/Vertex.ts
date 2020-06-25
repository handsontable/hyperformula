/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {EmptyCellVertex, FormulaCellVertex, MatrixVertex, ParsingErrorVertex, RangeVertex, ValueCellVertex} from './'

/**
 * Represents vertex which keeps values of one or more cells
 */
export type CellVertex = FormulaCellVertex | ValueCellVertex | EmptyCellVertex | MatrixVertex | ParsingErrorVertex

/**
 * Represents any vertex
 */
export type Vertex = CellVertex | RangeVertex
