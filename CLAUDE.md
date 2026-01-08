# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HyperFormula is a headless spreadsheet engine written in TypeScript. It parses and evaluates Excel-compatible formulas and can run in browser or Node.js environments. The library implements ~400 built-in functions with support for custom functions, undo/redo, CRUD operations, and i18n (17 languages).

## Build & Development Commands

```bash
npm install                  # Install dependencies
npm run compile              # TypeScript compilation to lib/
npm run bundle-all           # Full build: compile + bundle all formats
npm run lint                 # Run ESLint
npm run lint:fix             # Auto-fix lint issues
```

## Testing

```bash
npm test                     # Full suite: lint + unit + browser + compatibility
npm run test:unit            # Jest unit tests only
npm run test:watch           # Jest watch mode (run tests on file changes)
npm run test:coverage        # Unit tests with coverage report
npm run test:browser         # Karma browser tests (Chrome/Firefox)
npm run test:performance     # Run performance benchmarks
npm run test:compatibility   # Excel compatibility tests
```

Test files are located in `test/unit/` and follow the pattern `*.spec.ts`.

## Architecture

### Core Components

- **`src/HyperFormula.ts`** - Main engine class, public API entry point
- **`src/parser/`** - Formula parsing using Chevrotain parser generator
- **`src/interpreter/`** - Formula evaluation engine
- **`src/DependencyGraph/`** - Cell dependency tracking and recalculation order
- **`src/CrudOperations.ts`** - Create/Read/Update/Delete operations on sheets and cells

### Function Plugins (`src/interpreter/plugin/`)

All spreadsheet functions are implemented as plugins extending `FunctionPlugin`. Each plugin:
- Declares `implementedFunctions` static property mapping function names to metadata
- Uses `runFunction()` helper for argument validation, coercion, and array handling
- Registers function translations in `src/i18n/languages/`

To add a new function:
1. Create or modify a plugin in `src/interpreter/plugin/`
2. Add function metadata to `implementedFunctions`
3. Implement the function method
4. Add translations to all language files in `src/i18n/languages/`
5. Add tests in `test/unit/interpreter/`

### i18n (`src/i18n/languages/`)

Function name translations for each supported language. When adding new functions, translations can be found at:
- https://support.microsoft.com/en-us/office/excel-functions-translator-f262d0c0-991c-485b-89b6-32cc8d326889
- http://dolf.trieschnigg.nl/excel/index.php

## Output Formats

The build produces multiple output formats:
- `commonjs/` - CommonJS modules (main entry)
- `es/` - ES modules (.mjs files)
- `dist/` - UMD bundles for browsers
- `typings/` - TypeScript declaration files

## Contributing Guidelines

- Create feature branches, never commit directly to master
- Target the `develop` branch for pull requests
- Add tests for all changes in `test/` folder
- Run linter before submitting (`npm run lint`)
- Maintain compatibility with Excel and Google Sheets behavior
- In documentation, commit messages, pull request descriptions and code comments, do not mention Claude Code nor LLM models used for code generation

## Response Guidelines

- By default speak ultra-concisely, using as few words as you can, unless asked otherwise.
- Focus solely on instructions and provide relevant responses.
- Ask questions to remove ambiguity and make sure you're speaking about the right thing.
- Ask questions if you need more information to provide an accurate answer.
- If you don't know something, simply say, "I don't know," and ask for help.
- Present your answer in a structured way, use bullet lists, numbered lists, tables, etc.
- When asked for specific content, start the response with the requested info immediately.
- When answering based on context, support your claims by quoting exact fragments of available documents.

## Code Style

- When generating code, prefer functional approach whenever possible (in JS/TS use filter, map and reduce functions).
- Make the code self-documenting. Use meaningfull names for classes, functions, valiables etc. Add code comments only when necessary.
- Add jsdocs to all classes and functions.
