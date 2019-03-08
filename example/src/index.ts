import { ParserWithCaching } from "./parser/ParserWithCaching"
import { Config } from "./Config"

import("../wasminterpreter/pkg/interpreter").then(module => {
  console.warn(module)
  module.greet("John")
  const config = new Config();
  const parser = new ParserWithCaching(config)
  const formula = "=42"
  const { ast, dependencies } = parser.parse(formula, { col: 0, row: 0 })
  console.warn(formula)
  console.warn(ast)
  // won't typecheck if yourlib does not expose the run function
  // module.run();
});
