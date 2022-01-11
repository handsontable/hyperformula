/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

export function objectDestroy(object: any) {
  for (const [key, value] of Object.entries(object)) {
    if (value instanceof Function) {
      (object as Record<string, any>)[key] = postMortem(value)
    } else {
      delete (object as Record<string, any>)[key]
    }
  }
}

function postMortem(method: any) {
  return () => {
    throw new Error(`The "${method}" method cannot be called because this HyperFormula instance has been destroyed`)
  }
}
