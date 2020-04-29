import './test-jasmine/test/_setupFiles/bootstrap';

// require all modules ending in ".spec.js" from the
// './temp-browser/test' directory and all subdirectories
const testsContext = require.context('./test-jasmine', true, /.spec.js$/);

testsContext.keys().forEach(testsContext);
