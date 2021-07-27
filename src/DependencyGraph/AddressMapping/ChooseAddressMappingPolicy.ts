/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {Destructable} from '../../Destructable'
import {DenseStrategy} from './DenseStrategy'
import {AddressMappingStrategyConstructor} from './IAddressMappingStrategy'
import {SparseStrategy} from './SparseStrategy'

export interface ChooseAddressMapping {
  call(fill: number): AddressMappingStrategyConstructor,
}

export class DenseSparseChooseBasedOnThreshold extends Destructable implements ChooseAddressMapping {
  constructor(
    private readonly threshold: number,
  ) {
    super()
  }

  public call(fill: number) {
    if (fill > this.threshold) {
      return DenseStrategy
    } else {
      return SparseStrategy
    }
  }
}

export class AlwaysSparse extends Destructable implements ChooseAddressMapping {
  public call() {
    return SparseStrategy
  }
}

export class AlwaysDense extends Destructable implements ChooseAddressMapping {
  public call() {
    return DenseStrategy
  }
}
