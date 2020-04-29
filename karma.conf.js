const env = process.env.NODE_ENV || 'base';
const configFactory = require(`./.config/karma/${env}`);

module.exports = function(config) {
  config.set(
    configFactory.create(config)
  );
};
