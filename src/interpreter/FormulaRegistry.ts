/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {FunctionPlugin, FunctionPluginDefinition, IImplementedFunction} from './plugin/FunctionPlugin'
import {Interpreter} from './Interpreter'
import {Maybe} from '../Maybe'
import {Config} from '../Config'
import {FormulaPluginValidationError} from '../errors'

export class FormulaRegistry {
  public static plugins: Map<string, [string, FunctionPluginDefinition]> = new Map()

  public static registerFormulaPlugins(...plugins: FunctionPluginDefinition[]): void {
    for (const plugin of plugins) {
      this.loadPluginFormulas(plugin, this.plugins)
    }
  }

  public static registerFormula(formulaId: string, plugin: FunctionPluginDefinition): void {
    const entry = plugin.implementedFunctions[formulaId]
    if (entry !== undefined) {
      this.loadPluginFormula(plugin, formulaId, this.plugins)
    } else {
      throw FormulaPluginValidationError.formulaNotDeclaredInPlugin(formulaId, plugin.name)
    }
  }

  public static unregisterFormula(functionId: string): void {
    this.plugins.delete(functionId)
  }

  public static getFormulas(): string[] {
    return Array.from(this.plugins.keys())
  }

  public static getFormulaPlugin(formulaId: string): Maybe<FunctionPluginDefinition> {
    return this.plugins.get(formulaId)?.[1]
  }

  private static loadPluginFormulas(plugin: FunctionPluginDefinition, registry: Map<string, [string, FunctionPluginDefinition]>): void {
    Object.keys(plugin.implementedFunctions).forEach((functionName) => {
      this.loadPluginFormula(plugin, functionName, registry)
    })
  }

  private static loadPluginFormula(plugin: FunctionPluginDefinition, formulaId: string, registry: Map<string, [string, FunctionPluginDefinition]>): void {
    const methodName = plugin.implementedFunctions[formulaId].method
    // eslint-disable-next-line no-prototype-builtins
    if (plugin.prototype.hasOwnProperty(methodName)) {
      registry.set(formulaId, [methodName, plugin])
    } else {
      throw FormulaPluginValidationError.formulaMethodNotFound(methodName, plugin.name)
    }
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

    for (const [formulaId, [, plugin]] of this.plugins.entries()) {
      this.categorizeFunction(formulaId, plugin.implementedFunctions[formulaId])
    }
  }

  public initializePlugins(interpreter: Interpreter): void {
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

  public getFormulas(): string[] {
    return Array.from(this.formulas.keys())
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

  private categorizeFunction(functionId: string, functionMetadata: IImplementedFunction): void {
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