# License key

{% hint style="info" %}
HyperFormula doesn't use an internet connection to validate the license key.
{% endhint %}

As this library is available under multiple licenses, we require you to specify which terms exactly apply to your case. You can do that by passing a license key in the `options` object alongside other settings you want to apply.

### GNU Affero General Public License \(AGPL\) v3.0

If you use the open-source version of HyperFormula, simply pass the string `agpl-v3`.

```javascript
const options = {
  licenseKey: 'agpl-v3',
  //... other options
}
```

### HyperFormula Non-Commercial License

If you use HyperFormula for purposes not intended for monetary compensation such as, but not limited to, teaching, academic research, evaluation, testing, and experimentation, pass the string `non-commercial-and-evaluation`.

```javascript
const options = {
  licenseKey: 'non-commercial-and-evaluation',
  //... other options
}
```

### Commercial License Agreement

After you purchase a commercial license, our sales team will deliver you a license key that needs to be passed in order to activate the software.

```javascript
const options = {
  licenseKey: '00000-00000-00000-00000-00000' //replace with the actual commercial key
  //... other options
}
```

### The validation process

To determine whether a user is still entitled to use a particular version of the software, HyperFormula simply compares the time between two dates. These dates come from two sources of information. One is the license key which stores the date that it was first generated. The other is the source code which contains information about the date of release.

### Notifications

If your license key is missing, invalid, or expired, you will see the corresponding notification in the console.

### Getting help

If you stumble across any issues while passing the license key, [contact](../miscellaneous/contact.md) our team.

