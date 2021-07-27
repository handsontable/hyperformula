/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

export class Destructable {
  public destroy() {
    for(const [key, property] of Object.entries(this)) {
      delete (this as Record<string,any>)[key]
      property?.destroy?.()
    }
    Object.setPrototypeOf(this, null)
  }
}
