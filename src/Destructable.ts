/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

export class Destructable {
  public destroy() {
    const name = this.constructor.name
    console.log('ENTERING', name)
    for(const [key, property] of Object.entries(this)) {
      console.log(`${name}.${key}`)
      delete (this as Record<string,any>)[key]
      property?.destroy?.()
      if(Array.isArray(property)) {

      }
      if(property instanceof Set) {

      }
      if(property instanceof Map) {

      }
      //TODO MIXINS FOR OTHER TYPES
    }
    console.log('LEAVING', name)
    Object.setPrototypeOf(this, null)
  }
}
