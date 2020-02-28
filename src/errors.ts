import {SimpleCellAddress} from './Cell'

export class NoSheetWithIdError extends Error {
  constructor(sheetId: number) {
    super(`There's no sheet with id = ${sheetId}`)
  }
}

export class NoSheetWithNameError extends Error {
  constructor(sheetName: string) {
    super(`There's no sheet with name '${sheetName}'`)
  }
}

export class InvalidAddressError extends Error {
  constructor(address: SimpleCellAddress) {
    super(`Address (row = ${address.row}, col = ${address.col}) is invalid`)
  }
}

export class InvalidArgumentsError extends Error {
  constructor() {
    super('Invalid arguments')
  }
}

export class NamedExpressionNameIsAlreadyTaken extends Error {
  constructor(expressionName: string) {
    super(`Name of Named Expression '${expressionName}' is already present in the workbook`)
  }
}

export class NamedExpressionNameIsInvalid extends Error {
  constructor(expressionName: string) {
    super(`Name of Named Expression '${expressionName}' is invalid`)
  }
}

export class NamedExpressionDoesNotExist extends Error {
  constructor(expressionName: string) {
    super(`Named Expression '${expressionName}' does not exist`)
  }
}

function replacer(key: any, val: any): any {
  switch (typeof val) {
    case 'function':
    case 'symbol':
      return val.toString()
    case 'bigint':
      return 'BigInt('+val.toString()+')'
    default: {
      if(val instanceof RegExp) {
        return 'RegExp('+val.toString()+')'
      } else {
        return val
      }
    }
  }
}

export class UnableToParse extends Error {
  constructor(value: any) {
    super(`Unable to parse value: ${JSON.stringify(value, replacer, 4)}`)
  }
}

export class ExpectedValueOfType extends Error {
  constructor(expectedType: string, paramName: string) {
    super(`Expected value of type: ${expectedType} for config parameter: ${paramName}`)
  }
}

export class ExpectedOneOfValues extends Error {
  constructor(values: string, paramName: string) {
    super(`Expected: ${values} for config parameter: ${paramName}`)
  }
}

