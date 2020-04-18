/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {FunctionPlugin, FunctionPluginDefinition, IImplementedFunction} from './plugin/FunctionPlugin'
import {Interpreter} from './Interpreter'
import {Maybe} from '../Maybe'
import {Config} from '../Config'

export class FormulaRegistry {
  public static plugins: Map<string, [string, FunctionPluginDefinition]> = new Map()

  public static registerFormulaPlugin(...plugins: FunctionPluginDefinition[]) {
    for (const plugin of plugins) {
      this.loadPluginFormulas(plugin, this.plugins)
    }
  }

  public static getFormulas(): IterableIterator<string> {
    return this.plugins.keys()
  }

  public static getFormulaPlugin(formulaId: string): Maybe<FunctionPluginDefinition> {
    return this.plugins.get(formulaId)?.[1]
  }

  private static loadPluginFormulas(plugin: FunctionPluginDefinition, register: Map<string, [string, FunctionPluginDefinition]>): void {
    Object.keys(plugin.implementedFunctions).forEach((functionName) => {
      const pluginFunctionData = plugin.implementedFunctions[functionName]
      const formulaId = pluginFunctionData.translationKey.toUpperCase()
      register.set(formulaId, [functionName, plugin])
    })
  }

  private readonly plugins: Map<string, [string, FunctionPluginDefinition]>
  private readonly formulas: Map<string, [string, FunctionPlugin]> = new Map()

  private readonly volatileFunctions: Set<string> = new Set()
  private readonly structuralChangeFunctions: Set<string> = new Set()
  private readonly functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string> = new Set()

  constructor(private config: Config) {
    if (config.functionPlugins.length > 0) {
      this.plugins = new Map()
      for (const plugin of config.functionPlugins) {
        FormulaRegistry.loadPluginFormulas(plugin, this.plugins)
      }
    } else {
      this.plugins = new Map(FormulaRegistry.plugins)
    }

    for (const [formulaId, [functionName, plugin]] of this.plugins.entries()) {
      this.categorizeFunction(formulaId, plugin.implementedFunctions[functionName])
    }
  }

  public init(interpreter: Interpreter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instances: any[] = []
    for (const [formulaId, [functionName, plugin]] of this.plugins.entries()) {
      let pluginInstance = instances.find(pluginInstance => pluginInstance instanceof plugin)
      if (pluginInstance === undefined) {
        pluginInstance = new plugin(interpreter)
        instances.push(pluginInstance)
      }
      this.formulas.set(formulaId, [functionName, pluginInstance])
    }
  }

  public getFormula(formulaId: string): Maybe<[string, FunctionPlugin]> {
    return this.formulas.get(formulaId)
  }

  public getFormulas(): IterableIterator<string> {
    return this.formulas.keys()
  }

  public doesFormulaNeedArgumentToBeComputed = (formulaId: string): boolean => {
    return this.functionsWhichDoesNotNeedArgumentsToBeComputed.has(formulaId)
  }

  public isFormulaVolatile = (formulaId: string): boolean => {
    return this.volatileFunctions.has(formulaId)
  }

  public isFormulaDependentOnSheetStructureChange = (formulaId: string): boolean => {
    return this.structuralChangeFunctions.has(formulaId)
  }

  private categorizeFunction(functionId: string, functionMetadata: IImplementedFunction) {
    if (functionMetadata.isVolatile) {
      this.volatileFunctions.add(functionId)
    }
    if(functionMetadata.doesNotNeedArgumentsToBeComputed) {
      this.functionsWhichDoesNotNeedArgumentsToBeComputed.add(functionId)
    }
    if(functionMetadata.isDependentOnSheetStructureChange) {
      this.structuralChangeFunctions.add(functionId)
    }
  }
}