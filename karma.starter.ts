import './test/_setupFiles/bootstrap';

// require all modules ending in ".spec.js" from the
// './temp-browser/test' directory and all subdirectories
const testsContext = require.context('./test', true, /.spec.ts$/);

testsContext.keys().forEach(testsContext);
