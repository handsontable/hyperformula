import {IAddressMappingStrategyConstructor, DenseStrategy, SparseStrategy} from './AddressMapping'

export interface ChooseAddressMappingPolicy {
  call(fill: number): IAddressMappingStrategyConstructor
}

export class DenseSparseChooseBasedOnThreshold implements ChooseAddressMappingPolicy {
  constructor(
    private readonly threshold: number
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

export class AlwaysSparseStrategy implements ChooseAddressMappingPolicy {
  public call() {
    return SparseStrategy
  }
}

export class AlwaysDenseStrategy implements ChooseAddressMappingPolicy {
  public call() {
    return SparseStrategy
  }
}
