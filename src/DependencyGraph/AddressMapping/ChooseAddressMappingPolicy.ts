import {DenseStrategy} from './DenseStrategy'
import {AddressMappingStrategyConstructor} from './IAddressMappingStrategy'
import {SparseStrategy} from './SparseStrategy'

export interface ChooseAddressMapping {
  call(fill: number): AddressMappingStrategyConstructor,
}

export class DenseSparseChooseBasedOnThreshold implements ChooseAddressMapping {
  constructor(
    private readonly threshold: number,
  ) {
  }

  public call(fill: number) {
    if (fill > this.threshold) {
      return DenseStrategy
    } else {
      return SparseStrategy
    }
  }
}

export class AlwaysSparse implements ChooseAddressMapping {
  public call() {
    return SparseStrategy
  }
}

export class AlwaysDense implements ChooseAddressMapping {
  public call() {
    return DenseStrategy
  }
}
