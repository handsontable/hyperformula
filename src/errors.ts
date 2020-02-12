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
    super(`Invalid arguments`)
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
