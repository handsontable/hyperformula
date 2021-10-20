/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {Config, ConfigParamsList} from './Config'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import {
  ConfigValueTooBigError,
  ConfigValueTooSmallError,
  ExpectedOneOfValuesError,
  ExpectedValueOfTypeError
} from './errors'

export function configValueFromParam(inputValue: any, expectedType: string | string[], paramName: ConfigParamsList) {
  if (typeof inputValue === 'undefined') {
    return Config.defaultConfig[paramName]
  } else if (typeof expectedType === 'string') {
    if (typeof inputValue === expectedType) {
      return inputValue
    } else {
      throw new ExpectedValueOfTypeError(expectedType, paramName)
    }
  } else {
    if (expectedType.includes(inputValue)) {
      return inputValue
    } else {
      throw new ExpectedOneOfValuesError(expectedType.map((val: string) => `'${val}'`).join(' '), paramName)
    }
  }
}

export function validateNumberToBeAtLeast(value: number, paramName: string, minimum: number) {
  if (value < minimum) {
    throw new ConfigValueTooSmallError(paramName, minimum)
  }
}

export function validateNumberToBeAtMost(value: number, paramName: string, maximum: number) {
  if (value > maximum) {
    throw new ConfigValueTooBigError(paramName, maximum)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function configValueFromParamCheck(inputValue: any, typeCheck: (object: any) => boolean, expectedType: string, paramName: ConfigParamsList) {
  if (typeCheck(inputValue)) {
    return inputValue
  } else if (typeof inputValue === 'undefined') {
    return Config.defaultConfig[paramName]
  } else {
    throw new ExpectedValueOfTypeError(expectedType, paramName)
  }
}

export function configCheckIfParametersNotInConflict(...params: { value: number | string | boolean, name: string }[]) {
  const valuesMap: Map<number | string | boolean, string[]> = new Map()

  params.forEach((param) => {
    const names = valuesMap.get(param.value) || []
    names.push(param.name)
    valuesMap.set(param.value, names)
  })

  const duplicates: string[][] = []
  for (const entry of valuesMap.values()) {
    if (entry.length > 1) {
      duplicates.push(entry)
    }
  }

  if (duplicates.length > 0) {
    duplicates.forEach(entry => entry.sort())
    const paramNames = duplicates.map(entry => `[${entry}]`).join('; ')
    throw new Error(`Config initialization failed. Parameters in conflict: ${paramNames}`)
  }
}

export function validateArgToType(inputValue: any, expectedType: string, paramName: string) {
  if (typeof inputValue !== expectedType) {
    throw new ExpectedValueOfTypeError(expectedType, paramName)
  }
}
