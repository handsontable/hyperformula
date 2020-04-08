/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import { ExportedChange } from './CellValue'
import {TinyEmitter} from 'tiny-emitter'

export enum Events {
  SheetAdded = 'sheetAdded',
  SheetRemoved = 'sheetRemoved',
  SheetRenamed = 'sheetRenamed',
  NamedExpressionAdded = 'namedExpressionAdded',
  NamedExpressionRemoved = 'namedExpressionRemoved',
  ValuesUpdated = 'valuesUpdated',
}

export interface Listeners {
  /**
   * The event is triggered upon adding a sheet anywhere inside the workbook.
   * 
   * @event 
   * 
   * @param {string} addedSheetDisplayName the name of added sheet
   */
  sheetAdded: (addedSheetDisplayName: string) => any,

  /**
   * The event is triggered upon removing a sheet from anywhere inside the workbook.
   * 
   * @event 
   * 
   * @param {string} removedSheetDisplayName the name of removed sheet
   * @param {ExportedChange[]} changes the values and location of applied changes
   */
  sheetRemoved: (removedSheetDisplayName: string, changes: ExportedChange[]) => any,

  /**
    * The event is triggered upon renaming a sheet anywhere inside the workbook.
    *  
    * @event 
    * 
    * @param {string} oldDisplayName the old name of a sheet before renaming
    * @param {string} newDisplayName the new name of the sheet after renaming 
   */
  sheetRenamed: (oldDisplayName: string, newDisplayName: string) => any,

  /**
   * The event is triggered upon adding a named expression with specified values and location.
   * 
   * @event 
   * 
   * @param {string} namedExpressionName the name of added expression
   * @param {ExportedChange[]} changes the values and location of applied changes
   */
  namedExpressionAdded: (namedExpressionName: string, changes: ExportedChange[]) => any,

  /**
   * The event is triggered upon removing a named expression with specified values and from an indicated location.
   * 
   * @event 
   * 
   * @param {string} namedExpressionName the name of removed expression
   * @param {ExportedChange[]} changes the values and location of applied changes
   */
  namedExpressionRemoved: (namedExpressionName: string, changes: ExportedChange[]) => any,

  /**
   * The event is triggered upon changing values in a specified location.
   * 
   * @event 
   * 
   * @param {ExportedChange[]} changes the values and location of applied changes
   */
  valuesUpdated: (changes: ExportedChange[]) => any,
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
