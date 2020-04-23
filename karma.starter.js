// We have to add missing matchers into Jasmine
beforeAll(() => {
  jasmine.addMatchers({
    toContainEqual: function(util) {
      return {
        compare: function(actual, expected) {
          return {
            pass: util.contains(actual, expected),
          };
        },
      };
    },
    toMatchObject: function() {
      return {
        compare: function(actual, expected) {
          let result = false;

          Object.keys(expected).forEach((key) => {
            result = actual[key] === expected[key];
          });

          return {
            pass: result,
          };
        },
      };
    },
    toStrictEqual: function(util) {
      return {
        compare: function(actual, expected) {
          return {
            pass: util.equals(actual, expected),
          };
        },
      };
    },
  });
});

import './temp-lib/test/_setupFiles/bootstrap';

// require all modules ending in ".spec.js" from the
// './temp-lib/test' directory and all subdirectories
const testsContext = require.context('./temp-lib', true, /.spec.js$/);
 
testsContext.keys().forEach(testsContext);
