export interface ParserConfig {
  functionArgSeparator: string,
  volatileFunctions(): Set<string>,
  structuralChangeFunctions(): Set<string>,
}
