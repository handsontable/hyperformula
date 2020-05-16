/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {NamedExpressionDependency, NamedExpressionRangeDependency} from './parser/RelativeDependency'

export type CellDependency = SimpleCellAddress | AbsoluteCellRange | NamedExpressionDependency | NamedExpressionRangeDependency
