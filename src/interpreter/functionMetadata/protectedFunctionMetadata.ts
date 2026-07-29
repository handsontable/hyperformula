/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionArgumentType} from '../plugin/FunctionPlugin'
import {StructuralMetadata} from './buildFunctionDescriptions'

/**
 * Authored structural metadata (parameter optionality, `repeatLastArgs`) for the protected built-in functions
 * (`FunctionRegistry._protectedPlugins`), keyed by canonical id.
 *
 * Protected ids are not registered as ordinary plugins, so they carry no `implementedFunctions` entry for
 * {@link HyperFormula.resolveFunctionMetadata} to read arity/optionality from:
 * - `OFFSET` is transformed at parse time into a cell/range reference and has no plugin at all.
 * - `VERSION` has a plugin (`VersionPlugin`), but it is deliberately excluded from the general registry so it can
 *   never be unregistered; reusing its `implementedFunctions` entry would require importing the protected plugin
 *   into the metadata builders, which this module avoids.
 *
 * Each entry's `parameters.length` MUST equal the corresponding `FunctionDoc.parameters.length` in `FUNCTION_DOCS`.
 * `HyperFormula.resolveFunctionMetadata` cross-checks the two for protected ids exactly as it does for plugin-backed
 * ones, and a mismatch fails safe rather than loudly: the function is silently dropped from both
 * `getAvailableFunctions` and `getFunctionDetails`, with nothing thrown and nothing logged. So keep the invariant
 * true by hand when editing either map — the only symptom of breaking it is a function that quietly disappears.
 */
export const PROTECTED_FUNCTION_METADATA: Record<string, StructuralMetadata> = {
  OFFSET: {
    parameters: [
      {argumentType: FunctionArgumentType.ANY},
      {argumentType: FunctionArgumentType.NUMBER},
      {argumentType: FunctionArgumentType.NUMBER},
      {argumentType: FunctionArgumentType.NUMBER, optionalArg: true},
      {argumentType: FunctionArgumentType.NUMBER, optionalArg: true},
    ],
    repeatLastArgs: 0,
  },
  VERSION: {
    parameters: [],
    repeatLastArgs: 0,
  },
}
