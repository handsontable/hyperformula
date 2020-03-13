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
   * Adding sheet event.
   * 
   * @event sheetAdded
   * 
   * @param {string} addedSheetDisplayName the name of added sheet
   */
  sheetAdded: (addedSheetDisplayName: string) => any,

  /**
   * Removing sheet event. 
   * 
   * @event sheetRemoved
   * 
   * @param {string} removedSheetDisplayName the name of removed sheet
   * @param {ExportedChange[]} changes the values and location of applied changes
   */
  sheetRemoved: (removedSheetDisplayName: string, changes: ExportedChange[]) => any,

  /**
    * Renaming sheet event.
    *  
    * @event sheetRenamed
    * 
    * @param {string} oldDisplayName the old name of a sheet before renaming
    * @param {string} newDisplayName the new name of the sheet after renaming 
   */
  sheetRenamed: (oldDisplayName: string, newDisplayName: string) => any,

  /**
   * Adding named expression event.
   * 
   * @event namedExpressionAdded
   * 
   * @param {string} namedExpressionName the name of added expression
   * @param {ExportedChange[]} changes the values and location of applied changes
   */
  namedExpressionAdded: (namedExpressionName: string, changes: ExportedChange[]) => any,

  /**
   * Removing named expression event.
   * 
   * @event namedExpressionRemoved
   * 
   * @param {string} namedExpressionName the name of removed expression
   * @param {ExportedChange[]} changes the values and location of applied changes
   */
  namedExpressionRemoved: (namedExpressionName: string, changes: ExportedChange[]) => any,

  /**
   * Updated values event.
   * 
   * @event valuesUpdated
   * 
   * @param {ExportedChange[]} changes the values and location of applied changes
   */
  valuesUpdated: (changes: ExportedChange[]) => any,
}

export interface TypedEmitter {
  on<Event extends keyof Listeners>(s: Event, listener: Listeners[Event]): void,
  emit<Event extends keyof Listeners>(s: Event, ...args: Parameters<Listeners[Event]>): void,
}

export interface Listenable {
  on<Event extends keyof Listeners>(s: Event, listener: Listeners[Event]): void,
}

export class Emitter extends TinyEmitter implements TypedEmitter {
}
