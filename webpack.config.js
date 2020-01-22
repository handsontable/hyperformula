const configFactory = require(`./.config/${process.env.NODE_ENV}`);

module.exports = function() {
  return configFactory.create();
};
