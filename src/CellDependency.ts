/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {NamedExpressionDependency} from './parser/RelativeDependency'

export type CellDependency = SimpleCellAddress | AbsoluteCellRange | NamedExpressionDependency
