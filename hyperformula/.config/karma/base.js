const webpackConfigFactory = require('../../webpack.config');

module.exports.create = function(config) {
  return {
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    client: {
      clearContext: false,
      spec: config.spec
    },

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'karma.starter.ts',
    ],

    // list of files / patterns to exclude
    exclude: [ ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'karma.starter.ts': ['webpack', 'sourcemap'],
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless', 'FirefoxHeadless'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    // Extending timeout fixes https://github.com/handsontable/hyperformula/issues/1430
    browserDisconnectTimeout : 60000,

    // Webpack's configuration for Karma
    webpack: (function() {
      // Take the second config from an array - full HF build.
      const config = webpackConfigFactory('development')[1];

      // Loaders are executed from bottom to top. Push ts-loader as a first loader.
      config.module.rules[0].use.push({
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.test.json'
        }
      });

      return config;
    }()),
  };
};
