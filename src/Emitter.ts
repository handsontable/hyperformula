/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {TinyEmitter} from 'tiny-emitter'
import {ExportedChange} from './Exporter'

export enum Events {
  SheetAdded = 'sheetAdded',
  SheetRemoved = 'sheetRemoved',
  SheetRenamed = 'sheetRenamed',
  NamedExpressionAdded = 'namedExpressionAdded',
  NamedExpressionRemoved = 'namedExpressionRemoved',
  ValuesUpdated = 'valuesUpdated',
  AsyncValuesUpdated = 'asyncValuesUpdated',
  EvaluationSuspended = 'evaluationSuspended',
  EvaluationResumed = 'evaluationResumed',
}

export interface Listeners {
  /**
   * Occurs when a sheet is added anywhere inside the workbook.
   *
   * @event
   *
   * @param {string} addedSheetDisplayName the name of added sheet
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildEmpty();
   *
   * // define a function to be called when the event occurs
   * const handler = (addedSheetDisplayName) => { console.log('baz') }
   *
   * // subscribe to the 'sheetAdded' event, pass the handler
   * hfInstance.on('sheetAdded', handler);
   *
   * // add a sheet to trigger the 'sheetAdded' event,
   * // the console prints 'baz' each time a sheet is added
   * hfInstance.addSheet('FooBar');
   *
   * // unsubscribe from the 'sheetAdded' event
   * hfInstance.off('sheetAdded', handler);
   *
   * // add a sheet
   * // this time, the console doesn't print anything
   * hfInstance.addSheet('FooBaz');
   * ```
   *
   * @category Sheet
   */
  sheetAdded: (addedSheetDisplayName: string) => any,

  /**
   * Occurs when a sheet is removed from anywhere inside the workbook.
   *
   * @event
   *
   * @param {string} removedSheetDisplayName the name of removed sheet
   * @param {ExportedChange[]} changes the values and location of applied changes
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   MySheet1: [ ['=SUM(MySheet2!A1:A2)'] ],
   *   MySheet2: [ ['10'] ],
   * });
   *
   * // define a function to be called when the event occurs
   * const handler = (removedSheetDisplayName, changes) => { console.log('baz') }
   *
   * // subscribe to the 'sheetRemoved' event, pass the handler
   * hfInstance.on('sheetRemoved', handler);
   *
   * // remove a sheet to trigger the 'sheetRemoved' event,
   * // the console prints 'baz' each time a sheet is removed
   * hfInstance.removeSheet('0');
   *
   * // unsubscribe from the 'sheetRemoved' event
   * hfInstance.off('sheetRemoved', handler);
   *
   * // remove a sheet
   * // this time, the console doesn't print anything
   * hfInstance.removeSheet('1');
   * ```
   *
   * @category Sheet
   */
  sheetRemoved: (removedSheetDisplayName: string, changes: ExportedChange[]) => any,

  /**
   * Occurs when a sheet is renamed anywhere inside the workbook.
   *
   * @event
   *
   * @param {string} oldDisplayName the old name of a sheet before renaming
   * @param {string} newDisplayName the new name of the sheet after renaming
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   MySheet1: [ ['=SUM(MySheet2!A1:A2)'] ],
   *   MySheet2: [ ['10'] ],
   * });
   *
   * // define a function to be called when the event occurs
   * const handler = (oldName, newName) => { console.log(`Sheet ${oldName} was renamed to ${newName}`) }
   *
   * // subscribe to the 'sheetRenamed' event, pass the handler
   * hfInstance.on('sheetRenamed', handler);
   *
   * // rename a sheet to trigger the 'sheetRenamed' event,
   * // the console prints `Sheet ${oldName} was renamed to ${newName}` each time a sheet is renamed
   * hfInstance.renameSheet(0, 'MySheet0');
   *
   * // unsubscribe from the 'sheetRenamed' event
   * hfInstance.off('sheetRenamed', handler);
   *
   * // rename a sheet
   * // this time, the console doesn't print anything
   * hfInstance.renameSheet(1, 'MySheet1');
   * ```
   *
   * @category Sheet
   */
  sheetRenamed: (oldDisplayName: string, newDisplayName: string) => any,

  /**
   * Occurs when a named expression with specified values and location is added.
   *
   * @event
   *
   * @param {string} namedExpressionName the name of added expression
   * @param {ExportedChange[]} changes the values and location of applied changes
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *   ['42'],
   * ]);
   *
   * // define a function to be called when the event occurs
   * const handler = (namedExpressionName, changes) => { console.log('baz') }
   *
   * // subscribe to the 'namedExpressionAdded' event, pass the handler
   * hfInstance.on('namedExpressionAdded', handler);
   *
   * // add a named expression
   * // the console prints 'baz' each time a named expression is added
   * const changes = hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100', 0);
   *
   * // unsubscribe from the 'namedExpressionAdded' event
   * hfInstance.off('namedExpressionAdded', handler);
   *
   * // add another named expression
   * // this time, the console doesn't print anything
   * const changes = hfInstance.addNamedExpression('uglyName', '=Sheet1!$A$1+100', 0);
   * ```
   *
   * @category Named Expression
   */
  namedExpressionAdded: (namedExpressionName: string, changes: ExportedChange[]) => any,

  /**
   * Occurs when a named expression with specified values is removed and from an indicated location.
   *
   * @event
   *
   * @param {string} namedExpressionName the name of removed expression
   * @param {ExportedChange[]} changes the values and location of applied changes
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *   ['42'],
   * ]);
   *
   * // define a function to be called when the event occurs
   * const handler = (namedExpressionName, changes) => { console.log('baz') }
   *
   * // subscribe to the 'namedExpressionRemoved' event, pass the handler
   * hfInstance.on('namedExpressionRemoved', handler);
   *
   * // add some named expressions
   * hfInstance.addNamedExpression('prettyName', '=Sheet1!$A$1+100', 0);
   * hfInstance.addNamedExpression('uglyName', '=Sheet1!$A$1+100', 0);
   *
   * // remove a named expression
   * // the console prints 'baz' each time a named expression is removed
   * const changes = hfInstance.removeNamedExpression('prettyName', 0);
   *
   * // unsubscribe from the 'namedExpressionRemoved' event
   * hfInstance.off('namedExpressionRemoved', handler);
   *
   * // remove another named expression
   * // this time, the console doesn't print anything
   * const changes = hfInstance.removeNamedExpression('uglyName', 0);
   * ```
   *
   * @category Named Expression
   */
  namedExpressionRemoved: (namedExpressionName: string, changes: ExportedChange[]) => any,

  /**
   * Occurs when values in a specified location are changed and cause recalculation.
   *
   * @event
   *
   * @param {ExportedChange[]} changes the values and location of applied changes
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromArray([
   *   ['1', '2', '=A1'],
   * ]);
   *
   * // define a function to be called when the event occurs
   * const handler = (changes) => { console.log('baz') }
   *
   * // subscribe to the 'valuesUpdated' event, pass the handler
   * hfInstance.on('valuesUpdated', handler);
   *
   * // trigger recalculation, for example, with the 'setCellContents' method
   * // the console prints 'baz' each time a value change triggers recalculation
   * const changes = hfInstance.setCellContents({ col: 3, row: 0, sheet: 0 }, [['=B1']]);
   *
   * // unsubscribe from the 'valuesUpdated' event
   * hfInstance.off('valuesUpdated', handler);
   *
   * // trigger another recalculation
   * // this time, the console doesn't print anything
   * const changes = hfInstance.setCellContents({ col: 3, row: 0, sheet: 0 }, [['=A1']]);
   * ```
   *
   * @category Values
   */
  valuesUpdated: (changes: ExportedChange[]) => any,

  /**
   * @category Values
   */
  asyncValuesUpdated: (changes: ExportedChange[]) => any,

  /**
   * Occurs when evaluation is suspended.
   *
   * @event
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   MySheet1: [ ['1'] ],
   *   MySheet2: [ ['10'] ]
   * });
   *
   * // define a function to be called when the event occurs
   * const handler = ( ) => { console.log('baz') }
   *
   * // subscribe to the 'evaluationSuspended' event, pass the handler
   * hfInstance.on('evaluationSuspended', handler);
   *
   * // suspend evaluation
   * // the console prints 'baz' each time evaluation is suspended
   * hfInstance.suspendEvaluation();
   *
   * // resume evaluation
   * hfInstance.resumeEvaluation();
   *
   * // unsubscribe from the 'evaluationSuspended' event
   * hfInstance.off('evaluationSuspended', handler);
   *
   * // suspend evaluation again
   * // this time, the console doesn't print anything
   * hfInstance.suspendEvaluation();;
   * ```
   *
   * @category Batch
   */
  evaluationSuspended: () => any,

  /**
   * Occurs when evaluation is resumed.
   *
   * @event
   *
   * @param {ExportedChange[]} changes the values and location of applied changes
   *
   * @example
   * ```js
   * const hfInstance = HyperFormula.buildFromSheets({
   *   MySheet1: [ ['1'] ],
   *   MySheet2: [ ['10'] ]
   * });
   *
   * // define a function to be called when the event occurs
   * const handler = (changes) => { console.log('baz') }
   *
   * // subscribe to the 'evaluationResumed' event, pass the handler
   * hfInstance.on('evaluationResumed', handler);
   *
   * // first, suspend evaluation
   * hfInstance.suspendEvaluation();
   *
   * // now, resume evaluation
   * // the console prints 'baz' each time evaluation is resumed
   * hfInstance.resumeEvaluation();
   *
   * // unsubscribe from the 'evaluationResumed' event
   * hfInstance.off('evaluationResumed', handler);
   *
   * // suspend evaluation again
   * hfInstance.suspendEvaluation();
   *
   * // resume evaluation again
   * // this time, the console doesn't print anything
   * hfInstance.resumeEvaluation();;
   * ```
   *
   * @category Batch
   */
  evaluationResumed: (changes: ExportedChange[]) => any,
}

export interface TypedEmitter {
  on<Event extends keyof Listeners>(s: Event, listener: Listeners[Event]): void,

  off<Event extends keyof Listeners>(s: Event, listener: Listeners[Event]): void,

  once<Event extends keyof Listeners>(s: Event, listener: Listeners[Event]): void,
}

export class Emitter extends TinyEmitter implements TypedEmitter {
  public emit<Event extends keyof Listeners>(event: Event, ...args: Parameters<Listeners[Event]>): this {
    super.emit(event, ...args)
    return this
  }
}
