// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**',
    '!**/node_modules/**',
  ],

  coverageProvider: 'v8',

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // A path to a module which exports an async function that is triggered once before all test suites
  globalSetup: '<rootDir>/test/_setupFiles/globalSetup.ts',

  // A set of global variables that need to be available in all test environments
  globals: {
    "ts-jest": {
      "tsConfig": "./test/tsconfig.json"
    }
  },

  // An array of file extensions your modules use
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js"
  ],

  // The paths to modules that run some code to configure or set up the testing environment after each test
  setupFilesAfterEnv: [
    '<rootDir>/test/_setupFiles/bootstrap.ts',
    '<rootDir>/test/_setupFiles/jest/bootstrap.ts'
  ],

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "<rootDir>/test/**/*spec.(ts|js)"
  ],

  silent: true,

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
};
