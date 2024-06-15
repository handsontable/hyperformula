/**
 * @license
 * Copyright (c) 2024 Handsoncode. All rights reserved.
 */

import { ProcedureAst } from '../../parser'
import { InterpreterState } from '../InterpreterState'
import { InterpreterValue } from '../InterpreterValue'
import { FunctionPlugin, FunctionPluginTypecheck } from './FunctionPlugin'


export class XlookupPlugin extends FunctionPlugin implements FunctionPluginTypecheck<XlookupPlugin> {
    public static implementedFunctions = {
        XLOOKUP: {
            method: 'xlookup',
            parameters: [
                // TODO @selim - add arguments
            ],
            repeatLastArgs: 2,
        }
    }

    public xlookup(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
        // TODO @selim - implement
        return 2
    }
}