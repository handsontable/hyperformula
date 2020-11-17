# Testing
The tests are done with Jest and Jasmine. The same test suite should
pass in both of them because the library might be used
[server-side](server-side-installation) or in a browser, so you have
to be sure that both environments are fine.

* **`npm run test`** - runs the linter and all tests
* **`npm run test:unit`** - runs unit tests
* **`npm run coverage`** - runs code coverage
* **`npm run test:browser`** - runs tests in **karma** once and closes all open browsers
* **`npm run test:browser.debug`** - runs test in **karma** only in Chrome until you exit the process. It watches changes in `src` and `test` directories and rebuilds them automatically.

If you want to run a specific `spec` file or a test suite you can add a `-spec` flag. For example:
* **`npm run test:browser.debug -- --spec=matrix.spec.ts`** - runs `matrix.spec.ts` only

## Linting

You can use the following commands to lint the code so it meets the
required standards. ESLint is used as the tool of choice in this case.

* **`npm run lint`** - lints the code
* **`npm run lint:fix`** - automatically fixes lint problems