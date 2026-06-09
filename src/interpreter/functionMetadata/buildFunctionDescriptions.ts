/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionPluginDefinition} from '../plugin/FunctionPlugin'

/**
 * Returns the canonical function id set: the union of every plugin's `implementedFunctions` keys.
 *
 * Aliases (kept in a separate `plugin.aliases` map) and protected ids (e.g. `VERSION`, `OFFSET`, registered
 * outside the regular plugin set) are excluded by construction. Operators such as `HF.ADD` are included because
 * they live in an arithmetic plugin's `implementedFunctions`.
 *
 * @param {FunctionPluginDefinition[]} plugins - registered function plugins, e.g. from `FunctionRegistry.getPlugins()`
 */
export function getCanonicalFunctionIds(plugins: FunctionPluginDefinition[]): string[] {
  const ids = new Set<string>()
  plugins.forEach(plugin => {
    Object.keys(plugin.implementedFunctions).forEach(id => ids.add(id))
  })
  return Array.from(ids)
}
