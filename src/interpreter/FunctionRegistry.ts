/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellContentParser} from '../CellContentParser'
import {Config} from '../Config'
import {AliasAlreadyExisting, FunctionPluginValidationError, ProtectedFunctionError} from '../errors'
import {HyperFormula} from '../HyperFormula'
import {TranslationSet} from '../i18n'
import {Maybe} from '../Maybe'
import {Interpreter} from './Interpreter'
import {
  AsyncPluginFunctionType,
  FunctionMetadata,
  FunctionPlugin,
  FunctionPluginDefinition,
  PluginArraySizeFunctionType,
  PluginFunctionType
} from './plugin/FunctionPlugin'
import {VersionPlugin} from './plugin/VersionPlugin'

export type FunctionTranslationsPackage = Record<string, TranslationSet>

function validateAndReturnMetadataFromName(functionId: string, plugin: FunctionPluginDefinition): FunctionMetadata {
  let entry = plugin.implementedFunctions[functionId]
  const key = plugin.aliases?.[functionId]
  if (key !== undefined) {
    if (entry !== undefined) {
      throw new AliasAlreadyExisting(functionId, plugin.name)
    }
    entry = plugin.implementedFunctions[key]
  }
  if (entry === undefined) {
    throw FunctionPluginValidationError.functionNotDeclaredInPlugin(functionId, plugin.name)
  }
  return entry
}

export class FunctionRegistry {
  public static plugins: Map<string, FunctionPluginDefinition> = new Map()

  private static readonly _protectedPlugins: Map<string, FunctionPluginDefinition | undefined> = new Map([
    ['VERSION', VersionPlugin],
    ['OFFSET', undefined],
  ])
  private readonly instancePlugins: Map<string, FunctionPluginDefinition>
  private readonly functions: Map<string, [string, FunctionPlugin]> = new Map()
  private readonly arraySizeFunctions: Map<string, [string, FunctionPlugin]> = new Map()
  private readonly asyncFunctions: Map<string, [string, FunctionPlugin]> = new Map()
  private readonly volatileFunctions: Set<string> = new Set()
  private readonly arrayFunctions: Set<string> = new Set()
  private readonly structuralChangeFunctions: Set<string> = new Set()
  private readonly functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string> = new Set()
  private readonly functionsMetadata: Map<string, FunctionMetadata> = new Map()

  constructor(private config: Config) {
    if (config.functionPlugins.length > 0) {
      this.instancePlugins = new Map()
      for (const plugin of config.functionPlugins) {
        FunctionRegistry.loadPluginFunctions(plugin, this.instancePlugins)
      }
    } else {
      this.instancePlugins = new Map(FunctionRegistry.plugins)
    }

    for (const [functionId, plugin] of FunctionRegistry.protectedFunctions()) {
      FunctionRegistry.loadFunctionUnprotected(plugin, functionId, this.instancePlugins)
    }

    for (const [functionId, plugin] of this.instancePlugins.entries()) {
      this.categorizeFunction(functionId, validateAndReturnMetadataFromName(functionId, plugin))
    }
  }

  public static registerFunctionPlugin(plugin: FunctionPluginDefinition, translations?: FunctionTranslationsPackage): void {
    this.loadPluginFunctions(plugin, this.plugins)
    if (translations !== undefined) {
      this.loadTranslations(translations)
    }
  }

  public static registerFunction(functionId: string, plugin: FunctionPluginDefinition, translations?: FunctionTranslationsPackage): void {
    this.loadPluginFunction(plugin, functionId, this.plugins)
    if (translations !== undefined) {
      this.loadTranslations(translations)
    }
  }

  public static unregisterFunction(functionId: string): void {
    if (this.functionIsProtected(functionId)) {
      throw ProtectedFunctionError.cannotUnregisterFunctionWithId(functionId)
    }
    this.plugins.delete(functionId)
  }

  public static unregisterFunctionPlugin(plugin: FunctionPluginDefinition): void {
    for (const protectedPlugin of this.protectedPlugins()) {
      if (protectedPlugin === plugin) {
        throw ProtectedFunctionError.cannotUnregisterProtectedPlugin()
      }
    }
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
    return [
      ...Array.from(this.plugins.keys()),
      ...Array.from(this._protectedPlugins.keys())
    ]
  }

  public static getPlugins(): FunctionPluginDefinition[] {
    return Array.from(new Set(this.plugins.values()).values())
  }

  public static getFunctionPlugin(functionId: string): Maybe<FunctionPluginDefinition> {
    if (this.functionIsProtected(functionId)) {
      return undefined
    } else {
      return this.plugins.get(functionId)
    }
  }

  public static functionIsProtected(functionId: string) {
    return this._protectedPlugins.has(functionId)
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
    if (plugin.aliases !== undefined) {
      Object.keys(plugin.aliases).forEach((functionName) => {
        this.loadPluginFunction(plugin, functionName, registry)
      })
    }
  }

  private static loadPluginFunction(plugin: FunctionPluginDefinition, functionId: string, registry: Map<string, FunctionPluginDefinition>): void {
    if (this.functionIsProtected(functionId)) {
      throw ProtectedFunctionError.cannotRegisterFunctionWithId(functionId)
    } else {
      this.loadFunctionUnprotected(plugin, functionId, registry)
    }
  }

  private static loadFunctionUnprotected(plugin: FunctionPluginDefinition, functionId: string, registry: Map<string, FunctionPluginDefinition>): void {
    const methodName = validateAndReturnMetadataFromName(functionId, plugin).method
    if (Object.prototype.hasOwnProperty.call(plugin.prototype, methodName)) {
      registry.set(functionId, plugin)
    } else {
      throw FunctionPluginValidationError.functionMethodNotFound(methodName, plugin.name)
    }
  }

  private static* protectedFunctions(): IterableIterator<[string, FunctionPluginDefinition]> {
    for (const [functionId, plugin] of this._protectedPlugins) {
      if (plugin !== undefined) {
        yield [functionId, plugin]
      }
    }
  }

  private static* protectedPlugins(): IterableIterator<FunctionPluginDefinition> {
    for (const [, plugin] of this._protectedPlugins) {
      if (plugin !== undefined) {
        yield plugin
      }
    }
  }

  public initializePlugins(interpreter: Interpreter, cellContentParser: CellContentParser): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instances: any[] = []
    for (const [functionId, plugin] of this.instancePlugins.entries()) {
      let foundPluginInstance = instances.find(pluginInstance => pluginInstance instanceof plugin)
      if (foundPluginInstance === undefined) {
        foundPluginInstance = new plugin(interpreter, cellContentParser)
        instances.push(foundPluginInstance)
      }
      const metadata = validateAndReturnMetadataFromName(functionId, plugin)
      const methodName = metadata.method
      this.functions.set(functionId, [methodName, foundPluginInstance])
      const arraySizeMethodName = metadata.arraySizeMethod
      if (arraySizeMethodName !== undefined) {
        this.arraySizeFunctions.set(functionId, [arraySizeMethodName, foundPluginInstance])
      }

      if (metadata.isAsyncMethod) {
        this.asyncFunctions.set(functionId, [methodName, foundPluginInstance])
      }
    }
  }

  public getFunctionPlugin(functionId: string): Maybe<FunctionPluginDefinition> {
    if (FunctionRegistry.functionIsProtected(functionId)) {
      return undefined
    }
    return this.instancePlugins.get(functionId)
  }

  public getFunction(functionId: string): Maybe<PluginFunctionType> {
    const pluginEntry = this.functions.get(functionId)
    if (pluginEntry !== undefined && this.config.translationPackage.isFunctionTranslated(functionId)) {
      const [pluginFunction, pluginInstance] = pluginEntry
      return (ast, state) => (pluginInstance as any as (Record<string, PluginFunctionType>))[pluginFunction](ast, state)
    } else {
      return undefined
    }
  }

  public getAsyncFunction(functionId: string): Maybe<AsyncPluginFunctionType> {
    const pluginEntry = this.asyncFunctions.get(functionId)
    if (pluginEntry !== undefined && this.config.translationPackage.isFunctionTranslated(functionId)) {
      const [pluginFunction, pluginInstance] = pluginEntry
      return (ast, state) => (pluginInstance as any as (Record<string, AsyncPluginFunctionType>))[pluginFunction](ast, state)
    } else {
      return undefined
    }
  }

  public getArraySizeFunction(functionId: string): Maybe<PluginArraySizeFunctionType> {
    const pluginEntry = this.arraySizeFunctions.get(functionId)
    if (pluginEntry !== undefined && this.config.translationPackage.isFunctionTranslated(functionId)) {
      const [pluginArraySizeFunction, pluginInstance] = pluginEntry
      return (ast, state) => (pluginInstance as any as Record<string, PluginArraySizeFunctionType>)[pluginArraySizeFunction](ast, state)
    } else {
      return undefined
    }
  }

  public getMetadata(functionId: string): Maybe<FunctionMetadata> {
    return this.functionsMetadata.get(functionId)
  }

  public getPlugins(): FunctionPluginDefinition[] {
    const plugins: Set<FunctionPluginDefinition> = new Set()
    for (const [functionId, plugin] of this.instancePlugins) {
      if (!FunctionRegistry.functionIsProtected(functionId)) {
        plugins.add(plugin)
      }
    }
    return Array.from(plugins)
  }

  public getRegisteredFunctionIds(): string[] {
    return Array.from(this.functions.keys())
  }

  public doesFunctionNeedArgumentToBeComputed = (functionId: string): boolean => this.functionsWhichDoesNotNeedArgumentsToBeComputed.has(functionId)

  public isFunctionVolatile = (functionId: string): boolean => this.volatileFunctions.has(functionId)

  public isArrayFunction = (functionId: string): boolean => this.arrayFunctions.has(functionId)

  public isAsyncFunction = (functionId: string): boolean => this.asyncFunctions.has(functionId)

  public isFunctionDependentOnSheetStructureChange = (functionId: string): boolean => this.structuralChangeFunctions.has(functionId)

  private categorizeFunction(functionId: string, functionMetadata: FunctionMetadata): void {
    if (functionMetadata.isVolatile) {
      this.volatileFunctions.add(functionId)
    }
    if (functionMetadata.arrayFunction) {
      this.arrayFunctions.add(functionId)
    }
    if (functionMetadata.doesNotNeedArgumentsToBeComputed) {
      this.functionsWhichDoesNotNeedArgumentsToBeComputed.add(functionId)
    }
    if (functionMetadata.isDependentOnSheetStructureChange) {
      this.structuralChangeFunctions.add(functionId)
    }
    this.functionsMetadata.set(functionId, functionMetadata)
  }
}
