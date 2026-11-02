const configFactory = require('./base');

module.exports.create = function(config) {
  const configBase = configFactory.create(config);

  return {
    ...configBase,
    client: {
      ...configBase.client,
      // Keep the kjhtml results page on screen between runs. Only safe here,
      // where `singleRun` is false and a human is watching - see base.js.
      clearContext: false,
    },
    browsers: ['Chrome'],
    reporters: ['kjhtml'],
    singleRun: false,
    autoWatch: true,
  }
}
