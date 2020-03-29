/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {StatType} from './StatType'
import {Statistics} from './Statistics'

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
  public start(name: StatType): void {
    // do nothing
  }

  /** @inheritDoc */
  public end(name: StatType): void {
    // do nothing
  }
}
