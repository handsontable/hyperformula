# Basic usage

If you've already installed the library, it's time to start writing the first simple application.

First, if you used NPM or Yarn to install the package, make sure you have properly imported HyperFormula as shown below:

```javascript
import { HyperFormula } from 'hyperformula';
```

If you embed HyperFormula in the `<script>` tag using CDN, then it will be accessible as global variable `HyperFormula` and ready to use.  
  
Now you can use the [available options](configuration-options.md) to configure the instance of HyperFormula according to your needs, like this:

```javascript
const options = {
    precisionRounding: 10,
    licenseKey: 'agpl-v3'
};
```

Then, prepare some data to be used by your app. In this case, the data set will contain numbers and just one formula `=SUM(A1,B1)`. Use the `buildFromArray` method to create the instance:

```javascript
// define the data
const data = [['10', '20', '=SUM(A1,B1)']];

// build an instance with defined options and data 
const hfInstance = HyperFormula.buildFromArray(data, options);
```

{% hint style="info" %}
The instance can be created with three static methods:`buildFromArray`,`buildFromSheets` or `buildEmpty.` You can check all of their descriptions in our API reference. 
{% endhint %}

Alright, now it's time to do some calculations. Let's use the `getCellValue` method to retrieve the results of a formula included in the `data` .

```javascript
// call getCellValue to get the calculation results
const mySum = hfInstance.getCellValue({ col: 2, row: 0, sheet: 0 });
```

You can check the output in the console:

```javascript
// this outputs 30 in the console
console.log(mySum);
```

That's it! You've grasped a basic idea of how the HyperFormula engine works. It's time to move on to a more [advanced example.](advanced-usage.md)

### Demo

This demo presents the basic usage example integrated with a sample UI.

{% embed url="https://githubbox.com/handsontable/hyperformula-demos/tree/develop/basic-usage" %}



