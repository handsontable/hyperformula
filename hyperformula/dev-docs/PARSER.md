# The parser

`hyperformula/src/parser/` turns a formula string into an AST plus its relative dependencies, and turns an AST back into a string. It wraps the [Chevrotain](https://chevrotain.io/) parser generator.

## The pieces

| File | Role |
|---|---|
| `ParserWithCaching.ts` | The entry point. Formulas that are the same once the relative parts of their references are taken as offsets from their own cell — `=A1` in B1 and `=A2` in B2 — share one cached AST in `Cache.ts` rather than being reparsed. A formula that fails to parse is not cached. |
| `FormulaParser.ts` | The Chevrotain grammar. |
| `LexerConfig.ts`, `ParserConfig.ts` | Build the token set from the active language package and config. |
| `Ast.ts` | AST node types. |
| `Unparser.ts` | AST back to formula text, in the target language. |
| `collectDependencies.ts` | Relative dependencies of an AST. Resolving them is `src/absolutizeDependencies.ts`, at the source root, not here. |
| `Address.ts`, `CellAddress.ts`, `ColumnAddress.ts`, `RowAddress.ts` | Address representations and their absolute/relative flags. |
| `addressRepresentationConverters.ts` | A1 notation to and from the internal representation. |

## Rules

- **The lexer is language-dependent.** Function names, the argument separator, the decimal separator, and error literals all come from the config and the translation package. Never hard-code an English name or an English-locale separator. See [`I18N.md`](I18N.md).
- **Parsing and unparsing move together.** A grammar change that `Unparser.ts` does not learn about breaks round-tripping: the formula parses, the engine calculates, and `getCellFormula` returns something the user never typed. Add a round-trip test for every grammar change.
- **A function name can look like a cell reference.** `HEX2DEC` contains the cell reference `HEX2`, and `LOG10` is one. A new function with such a name needs a parse test and a round-trip test.
- **The cache is load-bearing.** `ParserWithCaching` does not key on the formula string. `computeHashFromTokens` hashes the lexer tokens with each reference in the AST's address form — relative parts as offsets from the formula's address, `$` parts absolute — and every function name except `OFFSET` made canonical (`OFFSET` has its own token and is hashed as typed); rewritten ASTs are stored and fetched under `computeHashFromAst`. The two must give the same key for the same formula, or `fetchCachedResultForAst` throws `There is no AST with such key in the cache`. A new token kind must hash to the same text in both: `computeHashFromTokens` falls back to the raw token image, so it needs its own branch whenever that image is not canonical, and `computeHashOfAstNode` needs a case for every new AST node type. A token that carries an address must be hashed in that address form, as the existing reference branches do with `cellAddressFromString` and `hash(true)`, never by its raw text — otherwise the same text in another cell reuses an AST built for the first. Anything else the parse result depends on must be in the key too.
- **Address arithmetic lives in the `*Address.ts` files.** Do not reimplement relative-to-absolute conversion at a call site.
- **A parse failure is a value.** It produces a `ParsingErrorVertex` in the dependency graph, not a thrown exception. One bad formula must not take down the engine.

## Testing

A grammar change needs cases for the happy parse, the round trip through `Unparser`, at least one non-English language, and the malformed input that must yield a parsing error rather than a throw.
