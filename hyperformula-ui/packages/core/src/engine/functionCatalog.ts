import type {
  FunctionCatalogEntry,
  FunctionParam,
  FunctionSignature,
  HyperFormulaLike,
} from "./types";

interface RichFunctionListEntry {
  localizedName: string;
  canonicalName: string;
  category?: string;
  shortDescription: string;
}

interface RichFunctionParam {
  name: string;
  description: string;
  optional: boolean;
}

interface RichFunctionDetails {
  shortDescription: string;
  documentationUrl: string;
  examples: string[];
  parameters: RichFunctionParam[];
  repeatLastArgs: number;
}

export class FunctionCatalog {
  private readonly engine: HyperFormulaLike | undefined;
  private readonly fallbackLanguage: string;
  private readonly catalogCache = new Map<string, FunctionCatalogEntry[]>();
  private readonly canonicalCache = new Map<string, Map<string, string>>();

  constructor(engine: HyperFormulaLike | undefined, fallbackLanguage: string) {
    this.engine = engine;
    this.fallbackLanguage = fallbackLanguage;
  }

  private resolveLanguage(): string {
    return this.engine?.getConfig?.().language ?? this.fallbackLanguage;
  }

  private rawAvailableFunctions(): unknown {
    if (typeof this.engine?.getAvailableFunctions !== "function") {
      return undefined;
    }

    try {
      return this.engine.getAvailableFunctions();
    } catch {
      return undefined;
    }
  }

  private availableFunctions(): FunctionCatalogEntry[] {
    const raw = this.rawAvailableFunctions();

    if (!Array.isArray(raw)) {
      return [];
    }

    const entries = (raw as RichFunctionListEntry[])
      .filter((entry) => typeof entry?.localizedName === "string")
      .map((entry) => ({
        name: entry.localizedName,
        canonicalName: entry.canonicalName ?? entry.localizedName,
        category: entry.category ?? "",
        shortDescription: entry.shortDescription ?? "",
      }));

    return entries.sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    );
  }

  private registeredNamesAsCatalog(): FunctionCatalogEntry[] {
    let names: string[] | undefined;

    try {
      names = this.engine?.getRegisteredFunctionNames?.();
    } catch {
      names = undefined;
    }

    if (!names) {
      return [];
    }

    return [...names]
      .sort()
      .map((name) => ({ name, canonicalName: name, category: "", shortDescription: "" }));
  }

  private canonicalNameFor(upperName: string): string {
    const lang = this.resolveLanguage();
    let map = this.canonicalCache.get(lang);

    if (!map) {
      map = new Map(
        this.getCatalog().map((entry) => [entry.name.toUpperCase(), entry.canonicalName]),
      );

      this.canonicalCache.set(lang, map);
    }

    return map.get(upperName) ?? upperName;
  }

  private rawFunctionDetails(canonical: string): unknown {
    if (typeof this.engine?.getFunctionDetails !== "function") {
      return undefined;
    }

    try {
      return this.engine.getFunctionDetails(canonical);
    } catch {
      return undefined;
    }
  }

  private signatureFromDetails(canonical: string, displayName: string): FunctionSignature | null {
    const details = this.rawFunctionDetails(canonical) as RichFunctionDetails | undefined;

    if (!details) {
      return null;
    }

    const parameters = details.parameters ?? [];
    const params = parameters.map((param) => {
      const mapped: FunctionParam = { label: param.name, optional: !!param.optional };

      if (param.description) {
        mapped.description = param.description;
      }

      return mapped;
    });

    const repeatLast = details.repeatLastArgs ?? 0;
    const signature: FunctionSignature = { name: displayName, params, repeatLast };

    if (details.shortDescription) {
      signature.description = details.shortDescription;
    }

    const firstExample = details.examples?.[0];

    if (firstExample) {
      signature.example = firstExample;
    }

    if (details.documentationUrl) {
      signature.docUrl = details.documentationUrl;
    }

    return signature;
  }

  private signatureFromPlugin(canonical: string, displayName: string): FunctionSignature | null {
    let plugin:
      | {
          implementedFunctions?: Record<
            string,
            {
              parameters?: Array<{
                argumentType?: unknown;
                optionalArg?: boolean;
                defaultValue?: unknown;
              }>;
              repeatLastArgs?: number;
            }
          >;
        }
      | undefined;

    try {
      plugin = this.engine?.getFunctionPlugin?.(canonical) as typeof plugin;
    } catch {
      return null;
    }

    if (!plugin) {
      return null;
    }

    const functionImpl = plugin.implementedFunctions?.[canonical];

    if (!functionImpl) {
      return { name: displayName, params: [], repeatLast: 0 };
    }

    const params = (functionImpl.parameters ?? []).map((param) => ({
      label: String(param.argumentType ?? "any").toLowerCase(),
      optional: !!param.optionalArg || param.defaultValue !== undefined,
    }));

    return { name: displayName, params, repeatLast: functionImpl.repeatLastArgs ?? 0 };
  }

  getCatalog(): FunctionCatalogEntry[] {
    const lang = this.resolveLanguage();
    const cached = this.catalogCache.get(lang);

    if (cached) {
      return cached;
    }

    const available = this.availableFunctions();
    const catalog = available.length > 0 ? available : this.registeredNamesAsCatalog();

    this.catalogCache.set(lang, catalog);

    return catalog;
  }

  getNames(): string[] {
    return this.getCatalog().map((entry) => entry.name);
  }

  getSignature(name: string): FunctionSignature | null {
    const displayName = name.toUpperCase();
    const canonical = this.canonicalNameFor(displayName);

    return (
      this.signatureFromDetails(canonical, displayName) ??
      this.signatureFromPlugin(canonical, displayName)
    );
  }

  filterEntries(prefix: string): FunctionCatalogEntry[] {
    const catalog = this.getCatalog();

    if (!prefix) {
      return catalog.slice(0, 50);
    }

    const upperPrefix = prefix.toUpperCase();
    const startsWithMatches: FunctionCatalogEntry[] = [];
    const containsMatches: FunctionCatalogEntry[] = [];

    for (const entry of catalog) {
      const upperName = entry.name.toUpperCase();

      if (upperName.startsWith(upperPrefix)) {
        startsWithMatches.push(entry);
      } else if (upperName.includes(upperPrefix)) {
        containsMatches.push(entry);
      }
    }

    return [...startsWithMatches, ...containsMatches].slice(0, 50);
  }

  filterNames(prefix: string): string[] {
    return this.filterEntries(prefix).map((entry) => entry.name);
  }
}
