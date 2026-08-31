# `src/parser/` — formula text to AST

Wraps the [Chevrotain](https://chevrotain.io/) parser generator. Turns a formula string into an AST plus its relative dependencies, and turns an AST back into a string.

## The pieces

| File | Role |
|---|---|
| `ParserWithCaching.ts` | The entry point. Identical formula strings resolve from `Cache.ts` rather than being reparsed. |
| `FormulaParser.ts` | The Chevrotain grammar. |
| `LexerConfig.ts`, `ParserConfig.ts` | Build the token set from the active language package and config. |
| `Ast.ts` | AST node types. |
| `Unparser.ts` | AST back to formula text, in the target language. |
| `collectDependencies.ts` | Relative dependencies of an AST. |
| `Address.ts`, `CellAddress.ts`, `ColumnAddress.ts`, `RowAddress.ts` | Address representations and their absolute/relative flags. |
| `addressRepresentationConverters.ts` | A1 notation to and from the internal representation. |

## Rules

- **The lexer is language-dependent.** Function names, the argument separator, the decimal separator, and error literals all come from the config and the translation package. Never hard-code an English name or an English-locale separator.
- **Parsing and unparsing move together.** A grammar change that `Unparser.ts` does not learn about breaks round-tripping: the formula parses, the engine calculates, and `getCellFormula` returns something the user never typed. Add a round-trip test for every grammar change.
- **The cache is load-bearing.** `ParserWithCaching` keys on the formula string. A change that makes the parse result depend on something outside that key — the address, the sheet, mutable config — silently returns the wrong AST from the cache. If the result must vary, the key must vary.
- Address arithmetic lives in the `*Address.ts` files. Do not reimplement relative-to-absolute conversion at a call site.
- A parse failure produces a `ParsingErrorVertex` in the graph, not a thrown exception. Keep it that way — one bad formula must not take down the engine.

## Testing

Grammar changes need cases for: the happy parse, the round trip through `Unparser`, at least one non-English language, and the malformed input that must yield a parsing error rather than a throw.
