const configFactory = require('./base');

module.exports.create = function(config) {
  const configBase = configFactory.create(config);

  return {
    ...configBase,
    browsers: ['Chrome'],
    reporters: ['kjhtml'],
    singleRun: false,
    autoWatch: true,
  }
}
