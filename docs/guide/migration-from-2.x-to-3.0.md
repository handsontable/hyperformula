# Migrating from 2.x to 3.0

To upgrade your HyperFormula version from 2.x.x to 3.0.0, follow this guide.


## Importing language files

### Typescript

```
"module": "node16",
"moduleResolution": "node16",
```

in tsconfig

### Webpack 4

Works but only with legacy paths. Webpack 4 does not support "exports". And requires special configuration for handling mjs files

I found out that webpack 4 does not support exports, and there seems to be no easy workaround for that. By tweaking the webpack configuration, I managed to make the project import HyperFormula correctly using the legacy paths. Working demo.

- https://github.com/webpack/webpack/issues/9509#issuecomment-1381896299
- https://stackoverflow.com/a/74957466
- https://github.com/handsontable/hyperformula-demos/tree/import-demos/import-demo-esm-webpack-4

### Parcel

parcel does not support "exports" by default, since v2.9 it can be configured to support it

- https://github.com/parcel-bundler/parcel/issues/4155
- https://parceljs.org/blog/v2-9-0/#new-resolver

### Angular

to be verified

```
"moduleResolution": "bundler",
```
