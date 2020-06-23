# Supported browsers

Each release of HyperFormula is tested on the **two latest versions** of every modern browser, on both mobile and desktop. In addition to running unit tests, we focus on two factors that are crucial for all users: performance and accuracy of calculations.

### Testing compatibility

Tests are run in [BrowserStack](https://www.browserstack.com/) as well as on a limited number of physical devices. Access to physical machines gives us an opportunity to measure GPU acceleration, which can't be done in a cloud testing platform that is based on virtual machines.

### List of supported browsers

| Desktop Browsers | Mobile Browsers |
| :--- | :--- |
| Chrome | Chrome |
| Firefox | Firefox for Android |
| Safari | Firefox for iOS |
| Edge Chromium | Safari iOS |
| Edge | Samsung Internet |
| UC Browser | UC Browser \* |
| QQ browser | Opera |

### Internet Explorer 11

There is no support for IE11 due to the issue with `gpu.js` which uses `gl-wiretap` as a dependency that is written in ES6 and does not have the ES5 build.

### \* Full ICU support

Browsers that do not support full-icu \(e.g. UC Browser mobile\) will not handle the comparison of accented strings properly. In these browsers, string comparison might give different results than in browsers that fully support the feature. 

Concerning full-icu, Node.js 13 or higher is required to handle string comparison properly. This can also be achieved with lower versions, like Node.js 10, but it requires the installation of the `full-icu` additional dependency.

