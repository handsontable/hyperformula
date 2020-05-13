/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

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
 * Error thrown when loaded sheet size exceeds configured limits.
 */
export class SheetSizeLimitExceededError extends Error {
  constructor() {
    super('Sheet size limit exceeded')
  }
}

/**
 * Error thrown when the the provided string is not a valid formula, i.e does not start with "="
 */
export class NotAFormulaError extends Error {
  constructor() {
    super('This is not a formula')
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
  constructor(expectedArguments?: string) {
    super(`Invalid arguments, expected ${expectedArguments}`)
  }
}

/**
 * Error thrown when the given named expression already exists in the workbook and therefore it cannot be added.
 */
export class NamedExpressionNameIsAlreadyTaken extends Error {
  constructor(expressionName: string) {
    super(`Name of Named Expression '${expressionName}' is already present`)
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
export class NoOperationToUndoError extends Error {
  constructor() {
    super('There is no operation to undo')
  }
}

export class NoOperationToRedoError extends Error {
  constructor() {
    super('There is no operation to redo')
  }
}

/**
 * Error thrown when there is nothing to paste by the [[paste]] method.
 */
export class NothingToPasteError extends Error {
  constructor() {
    super('There is nothing to paste')
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
 * It also displays the expected type.
 * This error might be thrown while setting or updating the [[ConfigParams]].
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
 * Error thrown when supplied config parameter value is too small.
 * This error might be thrown while setting or updating the [[ConfigParams]].
 * The following methods accept [[ConfigParams]] as a parameter:
 * 
 * @see [[buildEmpty]]
 * @see [[buildFromArray]]
 * @see [[buildFromSheets]]
 * @see [[updateConfig]]
 */
export class ConfigValueTooSmallError extends Error {
  constructor(paramName: string, minimum: number) {
    super(`Config parameter ${paramName} should be at least ${minimum}`)
  }
}

/**
 * Error thrown when supplied config parameter value is too big.
 * This error might be thrown while setting or updating the [[ConfigParams]].
 * The following methods accept [[ConfigParams]] as a parameter:
 * 
 * @see [[buildEmpty]]
 * @see [[buildFromArray]]
 * @see [[buildFromSheets]]
 * @see [[updateConfig]]
 */
export class ConfigValueTooBigError extends Error {
  constructor(paramName: string, maximum: number) {
    super(`Config parameter ${paramName} should be at most ${maximum}`)
  }
}

/**
 * Error thrown when the value was expected to be set for a config parameter.
 * It also displays the expected value.
 * This error might be thrown while setting or updating the [[ConfigParams]].
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
 * To perform any other action wait for the batch to complete or resume the evaluation.
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

/**
 * Error thrown when translation is missing in translation package.
 *
 * TODO
 */
export class MissingTranslationError extends Error {
  constructor(key: string) {
    super(`Translation for ${key} is missing in the translation package you're using.`)
  }
}

export class FunctionPluginValidationError extends Error {
  public static functionNotDeclaredInPlugin(formulaId: string, pluginName: string): FunctionPluginValidationError {
    return new FunctionPluginValidationError(`Formula with id ${formulaId} not declared in plugin ${pluginName}`)
  }

  public static functionMethodNotFound(functionName: string, pluginName: string): FunctionPluginValidationError {
    return new FunctionPluginValidationError(`Formula method ${functionName} not found in plugin ${pluginName}`)
  }
}