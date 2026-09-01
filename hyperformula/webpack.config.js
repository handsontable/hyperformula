module.exports = function(env) {
  if (typeof env !== 'string') {
    env = process.env.NODE_ENV
  }

  const configFactory = require(`./.config/webpack/${env}`);
  return configFactory.create();
};
