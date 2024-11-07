# Migrating from 2.x to 3.0

To upgrade your HyperFormula version from 2.x.x to 3.0.0, follow this guide.

## Importing language files

We changed the way of importing language files in ES module system to a more modern way using `mjs` files and `exports` property. This change is required to make HyperFormula compatible with newer ESM configurations in Node and browser environments.

The previous import paths became deprecated. For most environments they still work in version 3.0.0, but it will be removed in the future. To avoid any issues, update your code to use the new paths.

### New import paths for ES and CommonJS module systems

For ES and CommonJS modules, use the path `hyperformula/i18n/languages`, to import the language files. E.g.:

```javascript
import { frFR } from "hyperformula/i18n/languages"; // ESM

const { frFR } = require('hyperformula/i18n/languages'); // CommonJS
```
If you use the UMD module system, you don't need to change anything.

### Additional steps for projects using Angular

1. Make sure you use Typescript 5 or newer
2. In your `tsconfig.json`, set:

```
"moduleResolution": "bundler",
```

### Additional steps for projects using Typescript

In your `tsconfig.json`, set:

```
"module": "node16",
"moduleResolution": "node16",
```

### Additional steps for projects using Webpack 4 or older

1. In your code, use the legacy paths for importing language files. Unfortunately, Webpack 4 does not support `exports` property. E.g.:

```javascript
import { frFR } from "hyperformula/es/i18n/languages";
```

2. In your `webpack.config.js`, add the following configuration to handle `.mjs` files properly:

```javascript
module: {
  rules: [
    {
      test: /\.m?js$/,
      include: /node_modules/,
      type: "javascript/auto",
    },
  ],
}
```

### Additional steps for projects using Parcel

1. Make sure you use Parcel 2.9 or newer. Older versions of Parcel do not support `exports` property.
2. In your `package.json`, add the [following configuration](https://parceljs.org/blog/v2-9-0/#new-resolver):

```
"@parcel/resolver-default": {
  "packageExports": true
}
```

If you don't want to upgrade Parcel, you can keep using the legacy import paths for language files, but they will be removed in one of the upcoming releases. E.g.:

```javascript
import { frFR } from "hyperformula/es/i18n/languages";
```

### Other projects

We tested the changes with the most popular bundlers and frameworks. If you use a different configuration, and you encounter any issues, please contact us via GitHub. We will try to make it work for you, although for older versions of bundlers and frameworks, it might be impossible.
