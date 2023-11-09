/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

export class ProcessableValue<Raw, Processed> {
  private processedValue: Processed | null = null

  constructor(
    public rawValue: Raw,
    private processFn: (r: Raw) => Processed
  ) {}

  getProcessedValue(): Processed {
    if (this.processedValue === null) {
      this.processedValue = this.processFn(this.rawValue)
    }

    return this.processedValue
  }

  markAsModified() {
    this.processedValue = null
  }
}
