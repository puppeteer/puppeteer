# How to Contribute

First of all, thank you for your interest in Puppeteer!
We'd love to accept your patches and contributions!

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution,
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to <https://cla.developers.google.com/> to see
your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

## Getting setup

1. Clone this repository
```bash
git clone https://github.com/GoogleChrome/puppeteer
cd puppeteer
```
2.  Install dependencies
```bash
yarn # or 'npm install'
```

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Code Style

- coding style is fully defined in [.eslintrc](https://github.com/GoogleChrome/puppeteer/blob/master/.eslintrc.js)
- code should be annotated with [closure annotations](https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler)
- comments should be generally avoided. If the code would not be understood without comments, consider re-writing the code to make it self-explanatory

To run code linter, use:
```
npm run lint
```

## Writing Documentation

All public API should have a descriptive entry in the [docs/api.md](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md). There's a [documentation linter](https://github.com/GoogleChrome/puppeteer/tree/master/utils/doclint) which makes sure documentation is aligned with the codebase.

To run documentation linter, use
```
npm run doc
```

## Adding New Dependencies

For all dependencies (both installation and development):
- **Do not add** a dependency if the desired functionality is easily implementable
- if adding a dependency, it should be well-maintained and trustworthy

A barrier for introducing new installation dependencies is especially high:
- **do not add** installation dependency unless it's critical to project success

## Writing Tests

- every feature should be accompanied by a test
- every public api event/method should be accompanied by a test
- tests should be *hermetic*. Tests should not depend on external services.
- tests should work on all three platforms: Mac, Linux and Win. This is especially important for screenshot tests.

Puppeteer tests are located in [test/test.js](https://github.com/GoogleChrome/puppeteer/blob/master/test/test.js)
and are written using [Jasmine](https://jasmine.github.io/) testing framework. Despite being named 'unit', these are integration tests, making sure public API methods and events work as expected.

- To run all tests:
```
npm run unit
```
- To filter tests by name:
```
npm run unit -- --filter=waitFor
```
- To run a specific test, substitute the `it` with `fit` (mnemonic rule: '*focus it*'):
```js
  ...
  // Using "fit" to run specific test
  fit('should work', SX(async function() {
    const response = await page.goto(EMPTY_PAGE);
    expect(response.ok).toBe(true);
  }))
```
- To disable a specific test, substitute the `it` with `xit` (mnemonic rule: '*cross it*'):
```js
  ...
  // Using "xit" to skip specific test
  xit('should work', SX(async function() {
    const response = await page.goto(EMPTY_PAGE);
    expect(response.ok).toBe(true);
  }))
```
- To run tests in non-headless mode:
```
HEADLESS=false npm run unit
```
- To run tests with custom Chromium executable:
```
CHROME=<path-to-executable> npm run unit
```
- To run tests in slow-mode:
```
HEADLESS=false SLOW_MO=500 npm run unit
```
- To debug a test, "focus" a test first and then run:
```
npm run debug-unit
```

## Public API Coverage

Every public API method or event should be called at least once in tests. To ensure this, there's a coverage command which tracks calls to public API and reports back if some methods/events were not called.

Run coverage:

```
npm run coverage
```

## Debugging Puppeteer
See [Debugging Tips](README.md#debugging-tips) in the readme

