# Migrating from 2.x to 3.0

To upgrade your HyperFormula version from 2.x.x to 3.0.0, follow this guide.

## Importing language files

### Projects in Angular framework

#### Required steps

1. Upgrade to Typescript 5
2. In your `tsconfig.json`, set:

```
"moduleResolution": "bundler",
```

#### Explanation

TODO

### Projects in Typescript

#### Required steps

1. In your `tsconfig.json`, set:

```
"module": "node16",
"moduleResolution": "node16",
```

#### Explanation

TODO

### Projects using Webpack 4

#### Required steps

1. In your `webpack.config.js`, add the following configuration:

```
{
  test: /\.m?js$/,
  include: /node_modules/,
  type: "javascript/auto",
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      configFile: path.resolve(ROOT_DIRECTORY, 'config/babel.config.js'),
    },
  },
},
```

#### Explanation

TODO

Works but only with legacy paths. Webpack 4 does not support "exports". And requires custom babel-loader for handling mjs files.

I found out that webpack 4 does not support exports, and there seems to be no easy workaround for that. By tweaking the webpack configuration, I managed to make the project import HyperFormula correctly using the legacy paths. Working demo.

- https://github.com/webpack/webpack/issues/9509#issuecomment-1381896299
- https://stackoverflow.com/a/74957466
- https://github.com/handsontable/hyperformula-demos/tree/import-demos/import-demo-esm-webpack-4

### Parcel

#### Required steps

1. Upgrade to Parcel 2.9 or newer
2. In your `package.json`, add the following configuration:

```
"@parcel/resolver-default": {
  "packageExports": true
}
```

#### Explanation

parcel does not support "exports" by default, since v2.9 it can be configured to support it

- https://github.com/parcel-bundler/parcel/issues/4155
- https://parceljs.org/blog/v2-9-0/#new-resolver

// TODO