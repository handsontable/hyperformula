/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

export function objectDestroy(object: any) {
  if (object === null || typeof object !== 'object') {
    return
  }
  for (const key of Object.keys(object)) {
    if (!Object.prototype.hasOwnProperty.call(object, key)) {
      continue
    }
    const value = object[key]
    if (value instanceof Function) {
      object[key] = postMortem(value)
    } else {
      delete object[key]
    }
  }
}

function postMortem(method: any) {
  return () => {
    throw new Error(`The "${method}" method cannot be called because this HyperFormula instance has been destroyed`)
  }
}
