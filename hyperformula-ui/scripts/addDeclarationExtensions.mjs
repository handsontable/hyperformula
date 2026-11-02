import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const RELATIVE_SPECIFIER = /(\bfrom\s+|\bimport\s*\(\s*)(["'])(\.{1,2}\/[^"']*)\2/g;
const KNOWN_EXTENSION = /\.(?:js|mjs|cjs|json)$/;

const scriptArgs = process.argv.slice(2);
const dirFlagIndex = scriptArgs.indexOf("--dir");

if (dirFlagIndex === -1 || dirFlagIndex + 1 >= scriptArgs.length) {
  throw new Error("Missing required argument: --dir <path>");
}

const declarationsDir = resolve(process.cwd(), scriptArgs[dirFlagIndex + 1]);

function declarationFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return declarationFiles(entryPath);
    }

    return entry.name.endsWith(".d.ts") ? [entryPath] : [];
  });
}

function withExtension(fromFile, specifier) {
  if (KNOWN_EXTENSION.test(specifier)) {
    return specifier;
  }

  const target = resolve(dirname(fromFile), specifier);

  if (existsSync(`${target}.d.ts`)) {
    return `${specifier}.js`;
  }

  if (existsSync(join(target, "index.d.ts"))) {
    return `${specifier}/index.js`;
  }

  throw new Error(`${fromFile}: cannot resolve "${specifier}" to a declaration file`);
}

let rewrittenFiles = 0;

for (const file of declarationFiles(declarationsDir)) {
  const source = readFileSync(file, "utf8");
  const rewritten = source.replace(
    RELATIVE_SPECIFIER,
    (_match, prefix, quote, specifier) =>
      `${prefix}${quote}${withExtension(file, specifier)}${quote}`,
  );

  if (rewritten !== source) {
    writeFileSync(file, rewritten);
    rewrittenFiles += 1;
  }
}

process.stdout.write(
  `Added .js extensions to relative imports in ${rewrittenFiles} declaration files.\n`,
);
