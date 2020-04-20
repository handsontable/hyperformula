/**
 * If not equal environment script. Checks if the passed environment variables
 * are not equal with the variables stored in the system. If detected, the script
 * is terminated without an error otherwise terminates with error.
 */
const { parse } = require('querystring')

const [ /* node bin */, /* path to this script */, conditionToCheck ] = process.argv

if (!conditionToCheck) {
  throw Error('Missing condition to check')
}

const queryObject = parse(conditionToCheck)

Object.keys(queryObject).forEach((queryParam) => {
  if (process.env[queryParam] === queryObject[queryParam]) {
    process.exit(0)
  }
})

process.exit(1)
