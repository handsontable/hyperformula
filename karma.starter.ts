import './test/_setupFiles/bootstrap';

//@ts-ignore
const specArg: string = __karma__.config.spec;

// require all modules ending in ".spec.ts" from the
// './test' directory and all subdirectories
const testsContext = require.context('./test', true, /.spec.ts$/);
let files = testsContext.keys();

if (specArg) {
  const regEx = new RegExp(specArg);

  files = testsContext.keys().filter(key => key.match(regEx));
}

files.forEach(testsContext);
