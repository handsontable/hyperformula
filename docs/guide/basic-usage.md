# Basic usage

::: tip
The instance can be created with three static methods:
[`buildFromArray`](../api/classes/hyperformula.html#buildfromarray),
`buildFromSheets` or `buildEmpty`. You can check all of their
descriptions in our [API reference](../api).
:::

If you've already installed the library, it's time to start writing the
first simple application.

First, if you used NPM or Yarn to install the package, make sure you
have properly imported HyperFormula as shown below:

```javascript
import { HyperFormula } from 'hyperformula';
```

If you embed HyperFormula in the `<script>` tag using CDN, then it will
be accessible as global variable `HyperFormula` and ready to use.
  
Now you can use the [available options](configuration-options.md) to
configure the instance of HyperFormula according to your needs, like
this:

```javascript
const options = {
    licenseKey: 'gpl-v3'
};
```

Then, prepare some data to be used by your app. In this case, the data
set will contain numbers and just one formula `=SUM(A1,B1)`. Use the
`buildFromArray` method to create the instance:

```javascript
// define the data
const data = [['10', '20', '3.14159265359', '=SUM(A1:C1)']];

// build an instance with defined options and data 
const hfInstance = HyperFormula.buildFromArray(data, options);
```

Alright, now it's time to do some calculations. Let's use the
`getCellValue` method to retrieve the results of a formula included
in the `data` .

```javascript
// call getCellValue to get the calculation results
const mySum = hfInstance.getCellValue({ col: 3, row: 0, sheet: 0 });
```

You can check the output in the console:

```javascript
// this outputs the result in the browser's console
console.log(mySum);
```

That's it! You've grasped a basic idea of how the HyperFormula engine
works. It's time to move on to a more
[advanced example.](advanced-usage.md)

## Demo

<iframe
     src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/1.3.x/basic-usage?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="handsontable/hyperformula-demos: basic-usage"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
