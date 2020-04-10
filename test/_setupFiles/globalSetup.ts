/**
 * This script file presents you the opportunity of running some code immediately
 * before the test framework has been installed in the environment.
 */
export default async function() {
  const htConfig = require('./../../ht.config');

  // Extract all HF constants to the process environment namespance.
  // So the HT_RELEASE_DATE consts and other will be accessible while
  // testing the lib.
  Object.keys(htConfig).forEach((key) => {
    process.env[key] = htConfig[key];
  });
}
