import './test/_setupFiles/bootstrap';

//@ts-ignore
const specArg: string = __karma__.config.spec;

// require all modules ending in ".spec.ts" from the
// './test' directory and all subdirectories, except the private suite's
// 'compatibility' directory: its tools run in Node only
const testsContext = require.context('./test', true, /^(?!\.\/hyperformula-tests\/compatibility\/).*\.spec\.ts$/);
let files = testsContext.keys();

if (specArg) {
  const regEx = new RegExp(specArg);

  files = testsContext.keys().filter(key => key.match(regEx));
}

files.forEach(testsContext);
