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
 * Unlike plugin-backed functions, `HyperFormula.resolveFunctionMetadata`'s arity cross-check does not run for
 * protected ids (they return early, before that check), so this invariant is not enforced at runtime — it must be
 * kept true by hand when editing either map, otherwise `buildFunctionDetails` throws for the mismatched id.
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
