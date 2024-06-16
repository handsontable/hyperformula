/**
 * @license
 * Copyright (c) 2024 Handsoncode. All rights reserved.
 * 
 * Documentation from
 * https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
 */

import { AbsoluteCellRange } from '../../AbsoluteCellRange'
import { CellError, ErrorType } from '../../Cell'
import { ErrorMessage } from '../../error-message'
import { ProcedureAst } from '../../parser'
import { InterpreterState } from '../InterpreterState'
import { RawNoErrorScalarValue, InterpreterValue } from '../InterpreterValue'
import { SimpleRangeValue } from '../../SimpleRangeValue'
import { FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck } from './FunctionPlugin'
import { zeroIfEmpty } from '../ArithmeticHelper'
import { InvalidArgumentsError } from '../../errors'

enum RangeShape {
    Column = 1,
    Row = 2,
    Table = 3
}

export class XlookupPlugin extends FunctionPlugin implements FunctionPluginTypecheck<XlookupPlugin> {
    public static implementedFunctions = {
        XLOOKUP: {
            method: 'xlookup',
            parameters: [
                // lookup_value
                { argumentType: FunctionArgumentType.NOERROR },
                // lookup_array
                { argumentType: FunctionArgumentType.RANGE },
                // return_array
                { argumentType: FunctionArgumentType.RANGE },
                // [if_not_found]
                { argumentType: FunctionArgumentType.STRING, optionalArg: true, defaultValue: ErrorType.NA },
                // [match_mode]
                { argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 0 },
                // [search_mode]
                { argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 1 },
            ]
        }
    }

    public xlookup(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
        return this.runFunction(ast.args, state, this.metadata('XLOOKUP'), (key: RawNoErrorScalarValue, lookupRangeValue: SimpleRangeValue, returnRangeValue: SimpleRangeValue, ifNotFound: any, matchMode: number, searchMode: number) => {
            const lookupRange = lookupRangeValue.range
            const returnRange = returnRangeValue.range

            if (lookupRange === undefined) {
                return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
            }
            if (returnRange === undefined) {
                return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
            }
            if (ifNotFound !== ErrorType.NA && !(ifNotFound instanceof String)) {
                return new CellError(ErrorType.VALUE, ErrorMessage.NoConditionMet)
            }
            if (![0, -1, 1, 2].includes(matchMode)) {
                return new CellError(ErrorType.VALUE, ErrorMessage.NoConditionMet)
            }
            if (![1, -1, 1, 2].includes(searchMode)) {
                return new CellError(ErrorType.VALUE, ErrorMessage.NoConditionMet)
            }

            // TODO - Implement all options - until then, return NotSupported
            if (matchMode !== 0) {
                return new CellError(ErrorType.NAME, ErrorMessage.FunctionName("XLOOKUP"))
            }
            if (searchMode !== 1) {
                return new CellError(ErrorType.NAME, ErrorMessage.FunctionName("XLOOKUP"))
            }

            return this.doXlookup(zeroIfEmpty(key), lookupRangeValue.range!, returnRangeValue.range!, ifNotFound, matchMode, searchMode)
        })
    }

    private doXlookup(key: RawNoErrorScalarValue, lookupAbsRange: AbsoluteCellRange, absReturnRange: AbsoluteCellRange, ifNotFound: any, matchMode: number, searchMode: number): InterpreterValue {
        console.log("key", key)

        console.log("lookupAbsRange", lookupAbsRange)
        const rangeShape = XlookupPlugin.getRangeShape(lookupAbsRange)

        switch (rangeShape) {
            case RangeShape.Column: {
                break
            }
            case RangeShape.Row: {
                const searchedRange = SimpleRangeValue.onlyRange(AbsoluteCellRange.spanFrom(lookupAbsRange.start, lookupAbsRange.width(), 1), this.dependencyGraph)
                // const colIndex = this.searchInRange(key, searchedRange, sorted, this.rowSearch)
                break
            }
            case RangeShape.Table: {
                return new CellError(ErrorType.VALUE, ErrorMessage.CellRangeExpected)
            }
        }

        /**
         * Strategy
         * 1. [x] Check if lookupRange is a vertical or horizontal range
         * 2. [ ] If vertical, lookup row by row
         * 3. [ ] If horizontal, lookup column by column
         * 4. [ ] Find the cell that matches the condition and return its row and column
         * 5. [ ] If vertical, use that row, and return the range in the returnRange from its first column to its last column
         * 6. [ ] If horizontal, use that column, and return the range in the returnRange from its first row to its last row 
         */

        return 2
    }




    private static getRangeShape(absRange: AbsoluteCellRange): RangeShape {

        if (absRange.start.col === absRange.end.col && absRange.start.row <= absRange.end.row) {
            return RangeShape.Column
        }
        if (absRange.start.row === absRange.end.row && absRange.start.col <= absRange.end.col) {
            return RangeShape.Row
        }
        return RangeShape.Table
    }
}