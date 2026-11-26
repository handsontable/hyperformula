const path = require('path');
const fs = require('fs');
const { BannerPlugin } = require('webpack');

const licenseComment = fs.readFileSync(path.resolve(__dirname, '../source-license-header.js'), 'utf8').trim();
let licensePreamble = fs.readFileSync(path.resolve(__dirname, '../../../LICENSE.txt'), 'utf8');

licensePreamble += '\n\nVersion: ' + process.env.HT_VERSION;
licensePreamble += '\nRelease date: ' + process.env.HT_RELEASE_DATE + ' (built at ' + process.env.HT_BUILD_DATE + ')';

const NODE_MODULES = `${path.sep}node_modules${path.sep}`;
const LICENSE_FILE = /^licen[cs]e(\.(md|txt))?$/i;

/**
 * @param {object} module A module of the chunk.
 * @returns {string[]} The files it was built from: a concatenated module has several.
 */
function resourcesOf(module) {
  if (module.modules) {
    return module.modules.flatMap(resourcesOf);
  }

  return module.resource ? [module.resource.split('?')[0]] : [];
}

/**
 * @param {string} resource A file the bundle includes.
 * @returns {string|null} The directory of the npm package the file belongs to, or `null` for the engine's own code.
 */
function packageDirectoryOf(resource) {
  const index = resource.lastIndexOf(NODE_MODULES);

  if (index === -1) {
    return null;
  }

  const segments = resource.slice(index + NODE_MODULES.length).split(path.sep);
  const nameLength = segments[0].startsWith('@') ? 2 : 1;

  return resource.slice(0, index + NODE_MODULES.length) + segments.slice(0, nameLength).join(path.sep);
}

/**
 * The license notices of the npm packages a bundle includes: the dependencies `hyperformula.full.js` inlines, and the
 * `core-js` polyfills Babel adds to every bundle. Their licenses (MIT, Apache-2.0) require the notice in every copy,
 * and a bundle is also used on its own, without the packages' own files. The notices are read from the installed
 * packages, so they follow the versions the build uses.
 *
 * @param {object} chunk The chunk the banner is for.
 * @returns {string} The notices, or an empty string when the chunk includes no package.
 */
function thirdPartyNotices(chunk) {
  const directories = new Set();

  for (const module of chunk.modulesIterable) {
    for (const resource of resourcesOf(module)) {
      const directory = packageDirectoryOf(resource);

      if (directory) {
        directories.add(directory);
      }
    }
  }

  const notices = [...directories].map((directory) => {
    const { name, version, license } = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
    const licenseFile = fs.readdirSync(directory).find((file) => LICENSE_FILE.test(file));

    if (!licenseFile) {
      throw new Error(`The bundle includes ${name} ${version}, which has no license file to copy into its notices.`);
    }

    return `${name} ${version} (${license})\n\n${fs.readFileSync(path.join(directory, licenseFile), 'utf8').trim()}`;
  }).sort();

  if (notices.length === 0) {
    return '';
  }

  return `\n\n---\n\nThis file includes the following third-party packages:\n\n${notices.join('\n\n---\n\n')}`;
}

module.exports.create = function create(processedFile) {
  const config = {
    devtool: false,
    mode: 'none',
    performance: {
      hints: false,
    },
    output: {
      globalObject: `typeof self !== 'undefined' ? self : this`,
      library: 'HyperFormula',
      libraryExport: 'default',
      libraryTarget: 'umd',
      path: path.resolve(__dirname, '../../dist'),
      umdNamedDefine: true,
    },
    resolve: {
      alias: {},
      extensions: [ '.tsx', '.ts', '.js' ],
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          exclude: [
            /node_modules/,
          ],
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: false, // Disable cache. Necessary for injected variables into source code via ht.config.js
              },
            }
          ]
        },
        {
          test: /\.js$/,
          loader: 'string-replace-loader',
          options: {
            search: licenseComment,
            replace: '',
          }
        }
      ]
    },
    plugins: [
      new BannerPlugin({
        banner: ({ chunk }) => licensePreamble + thirdPartyNotices(chunk),
      }),
    ],
  };

  return [config];
}
