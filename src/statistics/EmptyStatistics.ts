/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {Statistics} from './Statistics'
import {StatType} from './StatType'

/** Do not store stats in the memory. Stats are not needed on daily basis */
export class EmptyStatistics extends Statistics {
  /** @inheritDoc */
  public incrementCriterionFunctionFullCacheUsed() {
    // do nothing
  }

  /** @inheritDoc */
  public incrementCriterionFunctionPartialCacheUsed() {
    // do nothing
  }

  /** @inheritDoc */
  public start(_name: StatType): void {
    // do nothing
  }

  /** @inheritDoc */
  public end(_name: StatType): void {
    // do nothing
  }
}
