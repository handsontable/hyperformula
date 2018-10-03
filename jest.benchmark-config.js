// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  globals: {
    "ts-jest": {
      "tsConfig": "tsconfig.json"
    }
  },

  moduleFileExtensions: [
    "ts",
    "tsx",
    "js"
  ],

  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "<rootDir>/test/*bench.(ts|tsx|js)"
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
};

