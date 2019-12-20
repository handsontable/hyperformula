const packageBody = require('./package.json');

process.env.HT_FILENAME = 'hyperformula';
process.env.HT_VERSION = packageBody.version;
process.env.HT_PACKAGE_NAME = packageBody.name;
process.env.HT_BUILD_DATE = new Date();
process.env.HT_RELEASE_DATE = '12/01/2020';

const configFactory = require(`./.config/${process.env.NODE_ENV}`);

module.exports = function() {
  return configFactory.create();
};
