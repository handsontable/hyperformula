module.exports = function(env = process.env.NODE_ENV) {
  const configFactory = require(`./.config/webpack/${env}`);

  return configFactory.create();
};
