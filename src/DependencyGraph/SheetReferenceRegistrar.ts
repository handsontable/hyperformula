/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AddressMapping} from './AddressMapping/AddressMapping'
import {SheetMapping} from './SheetMapping'

/**
 * Handles lazy registration of sheets referenced inside formulas.
 */
export class SheetReferenceRegistrar {
  constructor(
    private readonly sheetMapping: SheetMapping,
    private readonly addressMapping: AddressMapping,
  ) {}

  /**
   * Ensures that a sheet referenced by name has both a reserved entry in {@link SheetMapping}
   * and a placeholder strategy in {@link AddressMapping}.
   *
   * @param sheetName - display name of the referenced sheet
   * @returns the sheet identifier that represents the referenced sheet
   */
  public ensureSheetRegistered(sheetName: string): number {
    const sheetId = this.sheetMapping.reserveSheetName(sheetName)
    this.addressMapping.addSheetStrategyPlaceholderIfNotExists(sheetId)
    return sheetId
  }
}
