# AGENTS.md

Universal instructions for AI coding assistants (Claude Code, GitHub Copilot, Cursor, Gemini CLI, and others) working with the HyperFormula codebase.

For Claude Code specific setup see [CLAUDE.md](CLAUDE.md).

## What is HyperFormula

HyperFormula is a **headless spreadsheet engine** — no UI, no DOM. It parses Excel-compatible formulas, evaluates them, and returns computed values. It runs in browser and Node.js.

Core API surface (3 operations cover 90% of use):
```typescript
import { HyperFormula } from 'hyperformula';

const hf = HyperFormula.buildFromArray(data, { licenseKey: 'gpl-v3' });
const values = hf.getSheetValues(0);             // CellValue[][]
hf.setCellContents({ sheet: 0, row, col }, value); // RawCellContent
```

`licenseKey: 'gpl-v3'` is mandatory — without it the engine throws a license warning.

## Framework integration patterns

When helping users integrate HyperFormula with a framework, follow these idiomatic patterns:

| Framework | Instance storage | Cleanup | Reactive bridge | SSR guard |
|---|---|---|---|---|
| React | `useRef<HyperFormula>` | `useEffect` return | `useState<CellValue[][]>` | `dynamic(..., { ssr: false })` |
| Angular | `@Injectable` service with `BehaviorSubject` | `ngOnDestroy` (component-scoped) | `async` pipe | N/A (no default SSR) |
| Vue 3 | Class wrapper with private HF field | `onUnmounted` | `ref<CellValue[][]>` | `onMounted` + dynamic import |
| Svelte | top-level `const` in `<script>` | `onDestroy` | plain `let` (Svelte 4) | `onMount` + dynamic import |

Critical rules:
- **Vue:** keep the HF instance inside a wrapper class — Vue's Proxy breaks HF internal state (see Troubleshooting in guide)
- **Svelte:** always `onDestroy(() => hf.destroy())` — omitting it leaks the engine
- **React:** pattern survives `StrictMode` double-invocation (mount→unmount→mount)
- **Angular:** `providedIn: 'root'` services live for the app lifetime — scope to component for per-feature cleanup
- **SSR:** HF depends on browser-only APIs — guard with framework's client-only mechanism

Full guide with TypeScript snippets: `docs/guide/integration-with-{react,angular,vue,svelte}.md`

## Project structure

| Path | Description |
|---|---|
| `src/HyperFormula.ts` | Main engine class, public API |
| `src/interpreter/plugin/` | All function implementations (extend `FunctionPlugin`) |
| `src/parser/` | Chevrotain-based formula parser |
| `src/DependencyGraph/` | Cell dependency tracking |
| `src/i18n/languages/` | Function name translations (17 languages) |
| `test/unit/` | Jest tests (`*.spec.ts`) |
| `docs/guide/` | User-facing documentation (VuePress) |
| `docs/examples/` | 49 inline code examples rendered in docs |
| `typings/` | Generated `.d.ts` type declarations |

## Adding a new function

1. Create or modify plugin in `src/interpreter/plugin/`
2. Add metadata to `implementedFunctions` static property
3. Add translations to all 17 files in `src/i18n/languages/`
4. Add tests in `test/unit/interpreter/`
5. Use `runFunction()` helper for argument validation and coercion

## Key types

```typescript
CellValue     // number | string | boolean | DetailedCellError | null (output from getSheetValues)
RawCellContent // string | number | boolean | Date | null | undefined | RawCellContent[][] (input to setCellContents)
SimpleCellAddress // { sheet: number, row: number, col: number }
```

## Common mistakes to prevent

- Passing HF instance into Vue `reactive()` / `ref()` without `markRaw` → cryptic TypeError
- Forgetting `licenseKey` in config → silent warning, no crash, confusing for users
- Using `unknown` type for `setCellContents` value arg → use `RawCellContent`
- SSR: importing `hyperformula` at module scope in Next.js/Nuxt/SvelteKit → server crash
- Array functions: HF uses **parse-time array sizing** — output dimensions determined before evaluation

## Build and test

```bash
npm install          # Install dependencies
npm run test:unit    # Jest unit tests (fast)
npm run lint         # ESLint
npm run bundle-all   # Full build (compile + bundle)
npm run docs:dev     # Local docs preview (VuePress, port 8080)
```

## Contributing

- Branch from `develop`, never commit directly to master
- Tests required for all changes in `test/` folder
- Run linter before submitting
- Maintain compatibility with Excel and Google Sheets behavior
