import("../wasminterpreter/pkg/interpreter").then(module => {
  console.warn(module)
  module.greet("John")
  // won't typecheck if yourlib does not expose the run function
  // module.run();
});
