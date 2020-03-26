import {SimpleCellAddress} from './Cell'


/**
 * Error thrown when the sheet of a given ID does not exist.
 */
export class NoSheetWithIdError extends Error {
  constructor(sheetId: number) {
    super(`There's no sheet with id = ${sheetId}`)
  }
}

/**
 * Error thrown when the sheet of a given name does not exist.
 */
export class NoSheetWithNameError extends Error {
  constructor(sheetName: string) {
    super(`There's no sheet with name '${sheetName}'`)
  }
}

/**
 * Error thrown when the given address is invalid. 
 */
export class InvalidAddressError extends Error {
  constructor(address: SimpleCellAddress) {
    super(`Address (row = ${address.row}, col = ${address.col}) is invalid`)
  }
}

/**
 * Error thrown when the given arguments are invalid
 */
export class InvalidArgumentsError extends Error {
  constructor() {
    super('Invalid arguments')
  }
}

/**
 * Error thrown when the given named expression already exists in the workbook and therefore it cannot be added.
 */
export class NamedExpressionNameIsAlreadyTaken extends Error {
  constructor(expressionName: string) {
    super(`Name of Named Expression '${expressionName}' is already present in the workbook`)
  }
}

/**
 * Error thrown when the name given for the named expression is invalid.
 */
export class NamedExpressionNameIsInvalid extends Error {
  constructor(expressionName: string) {
    super(`Name of Named Expression '${expressionName}' is invalid`)
  }
}

/**
 * Error thrown when the given named expression does not exist.
 */
export class NamedExpressionDoesNotExist extends Error {
  constructor(expressionName: string) {
    super(`Named Expression '${expressionName}' does not exist`)
  }
}

/**
 * Error thrown when there are no operations to be undone by the [[undo]] method.
 */
export class NoOperationToUndo extends Error {
  constructor() {
    super('There is no operation to undo')
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

/**
 * Error thrown when the given value cannot be parsed.
 * 
 * Checks against the validity in:
 * 
 * @see [[buildFromArray]]
 * @see [[buildFromSheets]]
 * @see [[setCellsContents]]
 */
export class UnableToParse extends Error {
  constructor(value: any) {
    super(`Unable to parse value: ${JSON.stringify(value, replacer, 4)}`)
  }
}

/**
 * Error thrown when the expected value type differs from the given value type.
 * 
 * It also displays the expected type.
 * 
 * This error might be thrown while setting or updating the [[ConfigParams]].
 * 
 * The following methods accept [[ConfigParams]] as a parameter:
 * 
 * @see [[buildEmpty]]
 * @see [[buildFromArray]]
 * @see [[buildFromSheets]]
 * @see [[updateConfig]]
 */
export class ExpectedValueOfType extends Error {
  constructor(expectedType: string, paramName: string) {
    super(`Expected value of type: ${expectedType} for config parameter: ${paramName}`)
  }
}

/**
 * Error thrown when the value was expected to be set for a config parameter.
 * 
 * It also displays the expected value.
 * 
 * This error might be thrown while setting or updating the [[ConfigParams]].
 * 
 * The following methods accept [[ConfigParams]] as a parameter:
 * 
 * @see [[buildEmpty]]
 * @see [[buildFromArray]]
 * @see [[buildFromSheets]]
 * @see [[updateConfig]]
 */
export class ExpectedOneOfValues extends Error {
  constructor(values: string, paramName: string) {
    super(`Expected one of ${values} for config parameter: ${paramName}`)
  }
}

/**
 * Error thrown when computations become suspended.
 * 
 * To perform any other action wait for the batch to complete or resume the evaluation.
 * 
 * Relates to:
 * 
 * @see [[batch]]
 * @see [[suspendEvaluation]]
 * @see [[resumeEvaluation]]
 */
export class EvaluationSuspendedError extends Error {
  constructor() {
    super('Computations are suspended')
  }
}
