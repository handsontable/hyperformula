/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

export class Destructable {
  public destroy() {
    for(const [key, property] of Object.entries(this)) {
      delete (this as Record<string, any>)[key]
      recursiveDestroy(property)
    }
    Object.setPrototypeOf(this, null)
  }
}

function recursiveDestroy(object: any) {
  if(object?.destroy !== undefined) {
    object.destroy()
  } else if(Array.isArray(object)) {
    for(const element of object) {
      recursiveDestroy(element)
    }
    object.length = 0
  } else if(object instanceof Set) {
    for(const element of object) {
      recursiveDestroy(element)
    }
    object.clear()
  } else if(object instanceof Map) {
    for(const element of object.values()) {
      recursiveDestroy(element)
    }
    object.clear()
  } else if(object !== null && typeof object === 'object'){
    for(const element of Object.values(object)) {
      (element as any)?.destroy?.()
    }
  }
}
