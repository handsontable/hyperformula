/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {NamedExpressionDependency} from './parser/RelativeDependency'

export type CellDependency = SimpleCellAddress | AbsoluteCellRange | NamedExpressionDependency
