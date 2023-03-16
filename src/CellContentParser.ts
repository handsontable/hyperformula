/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

 import {CellError, ErrorType} from './Cell'
 import {Config} from './Config'
 import {DateTimeHelper, timeToNumber} from './DateTimeHelper'
 import {ErrorMessage} from './error-message'
 import {UnableToParseError} from './errors'
 import {fixNegativeZero, isNumberOverflow} from './interpreter/ArithmeticHelper'
 import {
   cloneNumber,
   CurrencyNumber,
   DateNumber,
   DateTimeNumber,
   ExtendedNumber,
   getRawValue,
   PercentNumber,
   TimeNumber
 } from './interpreter/InterpreterValue'
 import {Maybe} from './Maybe'
 import {NumberLiteralHelper} from './NumberLiteralHelper'
 
 export type RawCellContent = Date | string | number | boolean | null | undefined
 
 export namespace CellContent {
   export class Number {
     constructor(public readonly value: ExtendedNumber) {
       this.value = cloneNumber(this.value, fixNegativeZero(getRawValue(this.value)))
     }
   }
 
   export class String {
     constructor(public readonly value: string) {
     }
   }
 
   export class Boolean {
     constructor(public readonly value: boolean) {
     }
   }
 
   export class Empty {
 
     private static instance: Empty
 
     public static getSingletonInstance() {
       if (!Empty.instance) {
         Empty.instance = new Empty()
       }
       return Empty.instance
     }
   }
 
   export class Formula {
     constructor(public readonly formula: string) {
     }
   }
 
   export class Error {
     public readonly value: CellError
 
     constructor(errorType: ErrorType, message?: string) {
       this.value = new CellError(errorType, message)
     }
   }
 
   export type Type = Number | String | Boolean | Empty | Formula | Error
 }
 
 /**
  * Checks whether string looks like formula or not.
  *
  * @param text - formula
  */
 export function isFormula(text: string): boolean {
   return text.startsWith('=')
 }
 
 export function isBoolean(text: string): boolean {
   const tl = text.toLowerCase()
   return tl === 'true' || tl === 'false'
 }
 
 export function isPercent(text: string): boolean {
   const trimmedContent = text.trim()
 
   return trimmedContent.endsWith('%')
 }
 
 export function isError(text: string, errorMapping: Record<string, ErrorType>): boolean {
   const upperCased = text.toUpperCase()
   const errorRegex = /#[A-Za-z0-9\/]+[?!]?/
   return errorRegex.test(upperCased) && Object.prototype.hasOwnProperty.call(errorMapping, upperCased)
 }
 
 export class CellContentParser {
   constructor(
     private readonly config: Config,
     private readonly dateHelper: DateTimeHelper,
     private readonly numberLiteralsHelper: NumberLiteralHelper) {
   }
 
   public parse(content: RawCellContent): CellContent.Type {
     if (content === undefined || content === null) {
       return CellContent.Empty.getSingletonInstance()
     } else if (typeof content === 'number') {
       if (isNumberOverflow(content)) {
         return new CellContent.Error(ErrorType.NUM, ErrorMessage.ValueLarge)
       } else {
         return new CellContent.Number(content)
       }
     } else if (typeof content === 'boolean') {
       return new CellContent.Boolean(content)
     } else if (content instanceof Date) {
       const dateVal = this.dateHelper.dateToNumber({
         day: content.getDate(),
         month: content.getMonth() + 1,
         year: content.getFullYear()
       })
       const timeVal = timeToNumber({
         hours: content.getHours(),
         minutes: content.getMinutes(),
         seconds: content.getSeconds() + content.getMilliseconds() / 1000
       })
       const val = dateVal + timeVal
       if (val < 0) {
         return new CellContent.Error(ErrorType.NUM, ErrorMessage.DateBounds)
       }
       if (val % 1 === 0) {
         return new CellContent.Number(new DateNumber(val, 'Date()'))
       } else if (val < 1) {
         return new CellContent.Number(new TimeNumber(val, 'Date()'))
       } else {
         return new CellContent.Number(new DateTimeNumber(val, 'Date()'))
       }
     } else if (typeof content === 'string') {
       if (isBoolean(content)) {
         return new CellContent.Boolean(content.toLowerCase() === 'true')
       } else if (isFormula(content)) {
         return new CellContent.Formula(content)
       } else if (isError(content, this.config.errorMapping)) {
         return new CellContent.Error(this.config.errorMapping[content.toUpperCase()])
       } else if (isPercent(content)) {
        let trimmedContent = content.trim()
 
        trimmedContent = trimmedContent.slice(0, trimmedContent.length - 1)
    
        const val = this.numberLiteralsHelper.numericStringToMaybeNumber(trimmedContent)
    
        if (val !== undefined) {
          const parseAsNum = new PercentNumber(val / 100)
    
          return new CellContent.Number(parseAsNum)  
        }
    
        return new CellContent.String(this.getSlicedContentString(content))
       } else if(this.isCurrency(content)) {
         let trimmedContent = content.trim()
 
         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
         const res = this.currencyMatcher(trimmedContent)!
         const currency = res[0]
 
         trimmedContent = res[1]
 
         const val = this.numberLiteralsHelper.numericStringToMaybeNumber(trimmedContent)
 
         if (val !== undefined) {
          const parseAsNum = new CurrencyNumber(val, currency)
  
          return new CellContent.Number(parseAsNum)
         }
         return new CellContent.String(this.getSlicedContentString(content))
       } else {
         const trimmedContent = content.trim()
         const val = this.numberLiteralsHelper.numericStringToMaybeNumber(trimmedContent)
         
         if (val !== undefined) {
           return new CellContent.Number(val)
         }
         const parsedDateNumber = this.dateHelper.dateStringToDateNumber(trimmedContent)
         if (parsedDateNumber !== undefined) {
           return new CellContent.Number(parsedDateNumber)
         } else {
           return new CellContent.String(this.getSlicedContentString(content))
         }
       }
     } else {
       throw new UnableToParseError(content)
     }
   }

   public isCurrency(text: string): boolean {
     const trimmedContent = text.trim()
 
     return !!this.currencyMatcher(trimmedContent)
   }


  private getSlicedContentString(content: string): string {
    return content.startsWith('\'') ? content.slice(1) : content
  }
 
   private currencyMatcher(token: string): Maybe<[string, string]> {
     for (const currency of this.config.currencySymbol) {
       if (token.startsWith(currency)) {
         return [currency, token.slice(currency.length)]
       }
       if (token.endsWith(currency)) {
         return [currency, token.slice(0, token.length - currency.length)]
       }
     }
     return undefined
   }
 }
 