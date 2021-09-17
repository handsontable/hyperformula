# Supported browsers

Each release of HyperFormula is tested on the **two latest versions**
of every modern browser, on both mobile and desktop. In addition to
running unit tests, we focus on two factors that are crucial for all
users: performance and accuracy of calculations.

## List of supported browsers

| Desktop Browsers | Mobile Browsers |
| :--- | :--- |
| Chrome | Chrome |
| Firefox | Firefox for Android |
| Safari | Firefox for iOS |
| Edge Chromium | Safari iOS |
| Edge | Samsung Internet |
| UC Browser | UC Browser * |
| QQ browser | Opera |

## Full ICU support

Browsers that do not support full-icu (e.g. UC Browser mobile) will
not handle the comparison of accented strings properly. In
these browsers, string comparison might give different results than
in browsers that fully support the feature.

Concerning full-icu, Node.js 13 or higher is required to handle string
comparison properly. This can also be achieved with lower versions,
like Node.js 10, but it requires the installation of the `full-icu`
additional dependency.
