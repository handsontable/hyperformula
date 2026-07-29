/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Config} from '../Config'
import {AliasAlreadyExisting, FunctionPluginValidationError, ProtectedFunctionError} from '../errors'
import {HyperFormula} from '../HyperFormula'
import {TranslationSet} from '../i18n'
import {Maybe} from '../Maybe'
import {Interpreter} from './Interpreter'
import {
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

  /**
   * Maps each built-in canonical id to the built-in plugin that canonically provides it. Captured once at module
   * init (from `index.ts`, which already imports the plugin barrel to register the built-ins) so the metadata API
   * can tell a genuine built-in id from a user plugin that merely shadows a built-in id. Keyed by
   * `implementedFunctions` keys only, never aliases: callers resolve an alias to its target id before consulting it.
   *
   * Lives here rather than in the metadata builders so those builders need not import the plugin barrel: doing so
   * eagerly would create a module-load-order cycle (`HyperFormula.ts` pulls in the builders early). Written exactly
   * once, by the first {@link captureBuiltinFunctionOwners} call, and unaffected by later
   * `registerFunction`/`unregister` calls, so it stays a snapshot of the original built-in ownership.
   */
  private static readonly _builtinFunctionOwners: Map<string, FunctionPluginDefinition> = new Map()

  private static readonly _protectedPlugins: Map<string, FunctionPluginDefinition | undefined> = new Map([
    ['VERSION', VersionPlugin],
    ['OFFSET', undefined],
  ])
  private readonly instancePlugins: Map<string, FunctionPluginDefinition>
  private readonly functions: Map<string, [string, FunctionPlugin]> = new Map()
  private readonly arraySizeFunctions: Map<string, [string, FunctionPlugin]> = new Map()
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

  /**
   * Records the given plugins as the canonical built-in owners. Called once at module init by `index.ts` with the
   * complete built-in plugin set (which it already imports to register them). Only `implementedFunctions` keys are
   * snapshotted, not aliases, because alias lookups are resolved to their target id before {@link isBuiltinFunction}
   * is consulted.
   *
   * Every call after the first is a no-op. The built-in set is fixed at module init, so a later call could only come
   * from outside the library — and letting it through would let a caller pass their own plugin as a built-in owner,
   * making {@link isBuiltinFunction} attach a built-in's catalogue doc (description, parameter names, examples) to an
   * implementation that does not behave that way. That is exactly the misattribution this map exists to prevent.
   *
   * @internal
   * @param {FunctionPluginDefinition[]} builtinPlugins - the built-in plugin classes, as imported by `index.ts`
   */
  public static captureBuiltinFunctionOwners(builtinPlugins: FunctionPluginDefinition[]): void {
    if (this._builtinFunctionOwners.size > 0) {
      return
    }
    for (const plugin of builtinPlugins) {
      for (const id of Object.keys(plugin.implementedFunctions)) {
        this._builtinFunctionOwners.set(id, plugin)
      }
    }
  }

  /**
   * Returns whether `plugin` is the built-in plugin that canonically provides `canonicalId`. `false` when the id is
   * not a built-in id at all, or when a different (e.g. user-registered) plugin currently provides it. Lets the
   * metadata API gate use of the catalogue doc so a custom function shadowing a built-in id is never described with
   * the built-in's metadata.
   *
   * @internal
   * @param {string} canonicalId - the language-independent function id (the alias target, never an alias)
   * @param {FunctionPluginDefinition} plugin - the plugin currently registered for the id
   */
  public static isBuiltinFunction(canonicalId: string, plugin: FunctionPluginDefinition): boolean {
    return this._builtinFunctionOwners.get(canonicalId) === plugin
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

  /**
   * Returns the ids of all functions the function-metadata API (`getAvailableFunctions`/`getFunctionDetails`)
   * should describe: every registered, non-protected built-in function (canonical ids plus their aliases), plus
   * the protected ids (e.g. `VERSION`, `OFFSET`). Custom functions registered via registerFunctionPlugin are
   * excluded; they appear only in the instance method variant. Protected ids are excluded from registration
   * (`this.plugins`) so they can never be unregistered or shadowed, but a user can still call them from a formula,
   * so the metadata API surfaces them too (HF-249). Safe to include here: this method is consumed only by the
   * metadata API, never by anything that would let a caller register/unregister against a protected id.
   */
  public static getListableFunctionIds(): string[] {
    const ids: string[] = []
    for (const [functionId, plugin] of this.plugins.entries()) {
      // Resolve aliases to their canonical target id before checking built-in ownership
      const canonicalId = plugin.aliases?.[functionId] ?? functionId
      if (this.isBuiltinFunction(canonicalId, plugin)) {
        ids.push(functionId)
      }
    }
    // Surface protected ids (e.g. VERSION, OFFSET): excluded from `this.plugins` so they can't be
    // unregistered or shadowed, but callable from a formula, so the metadata API lists them too (HF-249).
    ids.push(...this._protectedPlugins.keys())
    return ids
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

  /**
   * Handles deprecated metadata properties.
   */
  private static handleDeprecatedMetadata(functionId: string, metadata: FunctionMetadata): void {
    if (metadata && metadata.arrayFunction !== undefined) {
      console.warn(`${functionId}: 'arrayFunction' parameter is deprecated since 3.1.0; Use 'enableArrayArithmeticForArguments' instead.`)
      metadata.enableArrayArithmeticForArguments = metadata.arrayFunction
    }

    if (metadata && metadata.arraySizeMethod !== undefined) {
      console.warn(`${functionId}: 'arraySizeMethod' parameter is deprecated since 3.1.0; Use 'sizeOfResultArrayMethod' instead.`)
      metadata.sizeOfResultArrayMethod = metadata.arraySizeMethod
    }
  }

  /**
   * Loads a function into the registry.
   */
  private static loadFunctionUnprotected(plugin: FunctionPluginDefinition, functionId: string, registry: Map<string, FunctionPluginDefinition>): void {
    const metadata = validateAndReturnMetadataFromName(functionId, plugin)
    const methodName = metadata.method

    this.handleDeprecatedMetadata(functionId, metadata)

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

  public initializePlugins(interpreter: Interpreter): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instances: any[] = []
    for (const [functionId, plugin] of this.instancePlugins.entries()) {
      let foundPluginInstance = instances.find(pluginInstance => pluginInstance instanceof plugin)
      if (foundPluginInstance === undefined) {
        foundPluginInstance = new plugin(interpreter)
        instances.push(foundPluginInstance)
      }
      const metadata = validateAndReturnMetadataFromName(functionId, plugin)
      const methodName = metadata.method
      this.functions.set(functionId, [methodName, foundPluginInstance])
      const arraySizeMethodName = metadata.sizeOfResultArrayMethod
      if (arraySizeMethodName !== undefined) {
        this.arraySizeFunctions.set(functionId, [arraySizeMethodName, foundPluginInstance])
      }
    }
  }

  public getFunctionPlugin(functionId: string): Maybe<FunctionPluginDefinition> {
    if (FunctionRegistry.functionIsProtected(functionId)) {
      return undefined
    }
    return this.instancePlugins.get(functionId)
  }

  /**
   * Returns the ids of all functions the instance-level function-metadata API should describe: every function
   * registered in this instance (aliases and any custom/user-registered functions included), plus the protected
   * ids (e.g. `VERSION`, `OFFSET`). `instancePlugins` already contains `VERSION` (the constructor loads any
   * protected id that has a plugin, unprotected, so it can be executed), but not `OFFSET` (it has no plugin at
   * all — it is transformed at parse time). Appending `FunctionRegistry._protectedPlugins`'s keys explicitly, the
   * same way the static {@link FunctionRegistry.getListableFunctionIds} does, covers both uniformly instead of
   * relying on the constructor's incidental loading; de-duplicated via `Set` because `VERSION` would otherwise be
   * listed twice (once from `instancePlugins`, once from `_protectedPlugins`). A user can see these ids via
   * `getAvailableFunctions`/`getFunctionDetails` even though they can never be unregistered (HF-249).
   */
  public getListableFunctionIds(): string[] {
    return Array.from(new Set([...this.instancePlugins.keys(), ...FunctionRegistry._protectedPlugins.keys()]))
  }

  public getFunction(functionId: string): Maybe<PluginFunctionType> {
    const pluginEntry = this.functions.get(functionId)
    if (pluginEntry !== undefined && this.config.translationPackage.isFunctionTranslated(functionId)) {
      const [pluginFunction, pluginInstance] = pluginEntry
      return (ast, state) => (pluginInstance as any as Record<string, PluginFunctionType>)[pluginFunction](ast, state)
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

  public isFunctionDependentOnSheetStructureChange = (functionId: string): boolean => this.structuralChangeFunctions.has(functionId)

  private categorizeFunction(functionId: string, functionMetadata: FunctionMetadata): void {
    if (functionMetadata.isVolatile) {
      this.volatileFunctions.add(functionId)
    }
    if (functionMetadata.enableArrayArithmeticForArguments) {
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
