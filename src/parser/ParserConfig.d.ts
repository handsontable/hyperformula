export interface ParserConfig {
  functionArgSeparator: string,
  volatileFunctions(): Set<string>,
}
