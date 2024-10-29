# Migrating from 2.x to 3.0

To upgrade your HyperFormula version from 2.x.x to 3.0.0, follow this guide.

## Importing language files

TODO: description of a change

### Projects in Angular framework

#### Required steps

1. Make sure you use Typescript 5 or newer
2. In your `tsconfig.json`, set:

```
"moduleResolution": "bundler",
```

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

TODO

parcel does not support "exports" by default, since v2.9 it can be configured to support it

- https://github.com/parcel-bundler/parcel/issues/4155
- https://parceljs.org/blog/v2-9-0/#new-resolver

// TODO
- read https://github.com/microsoft/TypeScript/issues/18442
- read https://github.com/microsoft/TypeScript/issues/49462
- read https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html