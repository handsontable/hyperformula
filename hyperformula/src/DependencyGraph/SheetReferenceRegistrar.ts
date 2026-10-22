/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AddressMapping} from './AddressMapping/AddressMapping'
import {SheetMapping} from './SheetMapping'

/**
 * Converts sheet names to ids and adds placeholder sheets if they don't exist.
 */
export class SheetReferenceRegistrar {
  constructor(
    private readonly sheetMapping: SheetMapping,
    private readonly addressMapping: AddressMapping,
  ) {}

  /**
   * Adds placeholder sheet if it doesn't exist and adds placeholder strategy to address mapping.
   * @returns {number} sheet id
   */
  public ensureSheetRegistered(sheetName: string): number {
    const sheetId = this.sheetMapping.addPlaceholderIfNotExists(sheetName)
    this.addressMapping.addSheetStrategyPlaceholderIfNotExists(sheetId)
    return sheetId
  }
}
