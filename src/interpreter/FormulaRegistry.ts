/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {FunctionPluginDefinition, PluginFunctionType} from './plugin/FunctionPlugin'
import {Interpreter} from './Interpreter'
import {Maybe} from '../Maybe'

export class FormulaRegistry {
  public static plugins: Map<string, [string, FunctionPluginDefinition]> = new Map()

  public static registerFormulaPlugin(plugin: FunctionPluginDefinition) {
    Object.keys(plugin.implementedFunctions).forEach((functionName) => {
      const pluginFunctionData = plugin.implementedFunctions[functionName]
      const formulaId = pluginFunctionData.translationKey.toUpperCase()
      this.plugins.set(formulaId, [functionName, plugin])
    })
  }

  public static getFormulas(): IterableIterator<string> {
    return this.plugins.keys()
  }

  public static getFormulaPlugin(formulaId: string): Maybe<FunctionPluginDefinition> {
    return this.plugins.get(formulaId)?.[1]
  }

  private plugins: Map<string, [string, FunctionPluginDefinition]> = new Map()
  private formulas: Map<string, PluginFunctionType> = new Map()

  constructor(private interpreter: Interpreter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instances: Map<FunctionPluginDefinition, any> = new Map()

    for (const [formulaId, [functionName, plugin]] of FormulaRegistry.plugins.entries()) {
      let pluginInstance = instances.get(plugin)
      if (pluginInstance === undefined) {
        pluginInstance = new plugin(interpreter)
        instances.set(plugin, pluginInstance)
      }
      this.formulas.set(formulaId, pluginInstance[functionName] as PluginFunctionType)
    }
  }

  public getFormula(formulaId: string): Maybe<PluginFunctionType> {
    return this.formulas.get(formulaId)
  }

  public getFormulas(): IterableIterator<string> {
    return this.formulas.keys()
  }
}