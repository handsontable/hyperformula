window.jest = {
  spyOn: spyOn,
  fn: jasmine.createSpy,
};
window.expect['arrayContaining'] = jasmine.arrayContaining;

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

// require all modules ending in "_test" from the
// current directory and all subdirectories
const testsContext = require.context('./lib/test', true, /.spec.js$/);
 
testsContext.keys().forEach(testsContext);
