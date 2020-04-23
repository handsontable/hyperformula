const configFactory = require(`./.config/webpack/${process.env.NODE_ENV}`);

module.exports = function() {
  return configFactory.create();
};
