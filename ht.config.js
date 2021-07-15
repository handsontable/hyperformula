const moment = require('moment');
const packageBody = require('./package.json');

module.exports = {
  HT_FILENAME: 'hyperformula',
  HT_VERSION: packageBody.version,
  HT_PACKAGE_NAME: packageBody.name,
  HT_BUILD_DATE: moment().format('DD/MM/YYYY HH:mm:ss'),
  HT_RELEASE_DATE: '15/07/2021',
};
