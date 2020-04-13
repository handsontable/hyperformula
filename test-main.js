window.jest = {
  spyOn: spyOn,
  fn: jasmine.createSpy,
};
window.expect['arrayContaining'] = jasmine.arrayContaining;

beforeAll(() => {
  jasmine.addMatchers({
    toStrictEqual: function(util) {
      return {
        compare: function(actual, expected) {
          return {
            pass: util.equals(actual, expected),
          };
        },
      };
    },
    toContainEqual: function(util) {
      return {
        compare: function(actual, expected) {
          return {
            pass: util.contains(actual, expected),
          };
        },
      };
    },
    toMatchObject: function(util) {
      return {
        compare: function(actual, expected) {
          return {
            pass: util.contains(actual, expected),
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
