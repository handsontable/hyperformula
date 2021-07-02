# License key

::: tip
HyperFormula doesn't use an internet connection to validate the
license key.
:::

As this library is available under multiple licenses, we require you
to specify which terms exactly apply to your case. You can do that by
passing a license key in the `options` object alongside other
settings you want to apply.

## GNU General Public License (GPL) v3.0

If you use the open-source version of HyperFormula, simply pass the
string `gpl-v3`.

```javascript
const options = {
  licenseKey: 'gpl-v3',
  //... other options
}
```

## Commercial License Agreement

After you purchase a commercial license, our sales team will deliver
you a license key that needs to be passed in order to activate the
software.

```javascript
const options = {
  licenseKey: '00000-00000-00000-00000-00000' //replace with the actual commercial key
  //... other options
}
```

## The validation process

To determine whether a user is still entitled to use a particular
version of the software, HyperFormula simply compares the time between
two dates. These dates come from two sources of information. One is
the library build date, and the other one is the date taken from the license key.
This process does not require any connections to the server.

## Notifications

If your license key is missing, invalid, or expired, you will see the
corresponding notification in the console.

## Getting help

If you stumble across any issues while passing the license key,
[contact](contact.md) our team.