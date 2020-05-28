/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {FunctionPlugin, FunctionPluginDefinition, FunctionMetadata} from './plugin/FunctionPlugin'
import {Interpreter} from './Interpreter'
import {Maybe} from '../Maybe'
import {Config} from '../Config'
import {FunctionPluginValidationError} from '../errors'
import {TranslationSet} from '../i18n'
import {HyperFormula} from '../HyperFormula'

export type FunctionTranslationsPackage = Record<string, TranslationSet>

export class FunctionRegistry {
  public static plugins: Map<string, FunctionPluginDefinition> = new Map()

  public static registerFunctionPlugin(plugin: FunctionPluginDefinition, translations?: FunctionTranslationsPackage): void {
    this.loadPluginFunctions(plugin, this.plugins)
    if (translations !== undefined) {
      this.loadTranslations(translations)
    }
  }

  public static registerFunction(functionId: string, plugin: FunctionPluginDefinition, translations?: FunctionTranslationsPackage): void {
    const entry = plugin.implementedFunctions[functionId]
    if (entry !== undefined) {
      this.loadPluginFunction(plugin, functionId, this.plugins)
    } else {
      throw FunctionPluginValidationError.functionNotDeclaredInPlugin(functionId, plugin.name)
    }
    if (translations !== undefined) {
      this.loadTranslations(translations)
    }
  }

  public static unregisterFunction(functionId: string): void {
    this.plugins.delete(functionId)
  }

  public static unregisterFunctionPlugin(plugin: FunctionPluginDefinition): void {
    for (const [functionId, registeredPlugin] of this.plugins.entries()) {
      if (registeredPlugin === plugin) {
        this.plugins.delete(functionId)
      }
    }
  }

  public static unregisterAll(): void {
    this.plugins.clear()
  }

  public static getRegisteredFunctionIds(): string[] {
    return Array.from(this.plugins.keys())
  }

  public static getPlugins(): FunctionPluginDefinition[] {
    return Array.from(new Set(this.plugins.values()).values())
  }

  public static getFunctionPlugin(functionId: string): Maybe<FunctionPluginDefinition> {
    return this.plugins.get(functionId)
  }

  private static loadTranslations(translations: FunctionTranslationsPackage) {
    const registeredLanguages = new Set(HyperFormula.getRegisteredLanguagesCodes())
    Object.keys(translations).forEach(code => {
      if (registeredLanguages.has(code)) {
        HyperFormula.getLanguage(code).extendFunctions(translations[code])
      }
    })
  }

  private static loadPluginFunctions(plugin: FunctionPluginDefinition, registry: Map<string, FunctionPluginDefinition>): void {
    Object.keys(plugin.implementedFunctions).forEach((functionName) => {
      this.loadPluginFunction(plugin, functionName, registry)
    })
  }

  private static loadPluginFunction(plugin: FunctionPluginDefinition, functionId: string, registry: Map<string, FunctionPluginDefinition>): void {
    const methodName = plugin.implementedFunctions[functionId].method
    if (Object.prototype.hasOwnProperty.call(plugin.prototype, methodName)) {
      registry.set(functionId, plugin)
    } else {
      throw FunctionPluginValidationError.functionMethodNotFound(methodName, plugin.name)
    }
  }

  private readonly instancePlugins: Map<string, FunctionPluginDefinition>
  private readonly functions: Map<string, [string, FunctionPlugin]> = new Map()

  private readonly volatileFunctions: Set<string> = new Set()
  private readonly structuralChangeFunctions: Set<string> = new Set()
  private readonly functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string> = new Set()

  constructor(private config: Config) {
    if (config.functionPlugins.length > 0) {
      this.instancePlugins = new Map()
      for (const plugin of config.functionPlugins) {
        FunctionRegistry.loadPluginFunctions(plugin, this.instancePlugins)
      }
    } else {
      this.instancePlugins = new Map(FunctionRegistry.plugins)
    }

    for (const [functionId, plugin] of this.instancePlugins.entries()) {
      this.categorizeFunction(functionId, plugin.implementedFunctions[functionId])
    }
  }

  public initializePlugins(interpreter: Interpreter): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instances: any[] = []
    for (const [functionId, plugin] of this.instancePlugins.entries()) {
      let pluginInstance = instances.find(pluginInstance => pluginInstance instanceof plugin)
      if (pluginInstance === undefined) {
        pluginInstance = new plugin(interpreter)
        instances.push(pluginInstance)
      }
      const methodName = plugin.implementedFunctions[functionId].method
      this.functions.set(functionId, [methodName, pluginInstance])
    }
  }

  public getFunctionPlugin(functionId: string): Maybe<FunctionPluginDefinition> {
    return this.instancePlugins.get(functionId)
  }

  public getFunction(functionId: string): Maybe<[string, FunctionPlugin]> {
    return this.functions.get(functionId)
  }

  public getPlugins(): FunctionPluginDefinition[] {
    return Array.from(new Set(this.instancePlugins.values()).values())
  }

  public getRegisteredFunctionIds(): string[] {
    return Array.from(this.functions.keys())
  }

  public doesFunctionNeedArgumentToBeComputed = (functionId: string): boolean => {
    return this.functionsWhichDoesNotNeedArgumentsToBeComputed.has(functionId)
  }

  public isFunctionVolatile = (functionId: string): boolean => {
    return this.volatileFunctions.has(functionId)
  }

  public isFunctionDependentOnSheetStructureChange = (functionId: string): boolean => {
    return this.structuralChangeFunctions.has(functionId)
  }

  private categorizeFunction(functionId: string, functionMetadata: FunctionMetadata): void {
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