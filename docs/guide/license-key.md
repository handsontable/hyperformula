# License key

To use HyperFormula, you need to specify which [license type](licensing.md#available-licenses) you use, by entering a license key in your [configuration options](configuration-options.md).

## GPLv3 license

To use HyperFormula in a non-commercial or open-source
project, use the [GNU General Public License v3.0](https://github.com/handsontable/hyperformula/blob/master/LICENSE.txt) (GPLv3):

* In your [configuration options](configuration-options.md), assign the mandatory `licenseKey` property to a string, `gpl-v3`:
  ```js
  const options = {
    licenseKey: 'gpl-v3',
    //... other options
  }
  ```

## Commercial license

To use HyperFormula in a commercial project, you need to purchase a commercial license:

1. Contact our [Sales Team](licensing.md#commercial-use) to purchase a commercial license.
2. Our Sales Team sends you your commercial license key.
3. In your [configuration options](configuration-options.md), assign the mandatory `licenseKey` property to your commercial license key:
    ```js
    const options = {
      // replace xxxx-xxxx-xxxx-xxxx-xxxx with your commercial license key:
      licenseKey: 'xxxx-xxxx-xxxx-xxxx-xxxx',
      //... other options
    }
    ```

### Commercial license key validation

::: tip
HyperFormula doesn't use an internet connection to validate your commercial
license key.
:::

To determine whether a user is still entitled to use a particular
version of the software, HyperFormula compares the time between
two dates:
* The HyperFormula build date
* The date in your commercial license key

This process doesn't require any connection to the server.

## License key notifications

If your license key is missing, invalid, or expired, you see a
corresponding notification in the console.

## License key support

If you have any issues with your license key, [contact our team](contact.md).