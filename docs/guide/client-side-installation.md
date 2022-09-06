# Client-side installation

### Install with npm or Yarn

You can install the latest version of HyperFormula with popular
packaging managers. Navigate to your project folder and run the
following command:
  
**npm:**

```bash
$ npm install hyperformula
```

**Yarn:**

```bash
$ yarn add hyperformula
```

The package will be added to your `package.json` file and installed to
the `./node_modules` directory.

Then you can import it into your file like this:

```javascript
import { HyperFormula } from 'hyperformula';

// your code
```

## Use CDN

Alternatively, you can load HyperFormula from
[jsDelivr](https://www.jsdelivr.com/) and embed the URL directly in the
`<script>` tag. This way you will make it accessible in the project as
a `HyperFormula` global variable.

Full build will include all the required dependencies:

```html
<script src="https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.full.min.js"></script>
```

Or you may load just a minimal build and add the dependencies on your own:

```html
<script src="https://cdn.jsdelivr.net/npm/chevrotain@6/lib/chevrotain.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tiny-emitter@2/dist/tinyemitter.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/unorm@1/lib/unorm.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.min.js"></script>
```

A useful option when you already use some of them and there is no need to duplicate the dependencies. You can read more about the dependencies of HyperFormula on a dedicated [Dependencies](/guide/dependencies.md) page.

## Clone from GitHub

If you choose to clone the project or download it from GitHub you
will need to build it prior to usage. Check the
[building section](building.md) for a full list of commands and their
descriptions.

### Clone with HTTPS

```bash
git clone https://github.com/handsontable/hyperformula.git
```

### Clone with SSH

```bash
git clone git@github.com:handsontable/hyperformula.git
```

## Download from GitHub

You can download all resources as a ZIP archive directly from the
[GitHub repository](https://github.com/handsontable/hyperformula).
Then, you can use one of the above-mentioned methods to install the
library.
