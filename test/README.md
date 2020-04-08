# Puppeteer unit tests

Unit tests in Puppeteer are written using [Mocha] as the test runner and [Expect] as the assertions library.

## Test state

We have some common setup that runs before each test and is defined in `mocha-utils.js`. This code creates a Puppeteer browser that can be used by tests. It also creates a `context` and `page` that are reset between each test and can be used to save the boilerplate of creating one every single time.

If you are in an `it` and want to use the provided state, you can call `getTestState` from `mocha-utils.js` to access them:

```js
const { page } = getTestState();
```

`getTestState` exposes the following that you can use in your tests. These will be reset/tidied between tests automatically for you:

* `puppeteer`: an instance of the Puppeteer library. This is exactly what you'd get if you ran `require('puppeteer')`.
* `browser`: a launched Puppeteer browser. Note that this persists for the entire test suite, rather than re-launch this on each test.
* `puppeteerPath`: the path to the root source file for Puppeteer.
* `defaultBrowserOptions`: the default options the Puppeteer browser is launched from in test mode, so tests can use them and override if required.
* `server`: a dummy test server instance (see `utils/testserver` for more).
* `httpsServer`: a dummy test server HTTPS instance (see `utils/testserver` for more).
* `isFirefox`: true if running in Firefox.
* `isChrome`: true if running Chromium.
* `isHeadless`: true if the test is in headless mode.

## Skipping tests for Firefox

Tests that are not expected to pass in Firefox can be skipped. You can skip an individual test by using `itFailsFirefox` rather than `it`. Similarly you can skip a describe block with `describeFailsFirefox`.

There is also `describeChromeOnly` which will only execute the test if running in Chromium. Note that this is different from `describeFailsFirefox`: the goal is to get any `FailsFirefox` calls passing in Firefox, whereas `describeChromeOnly` should be used to test behaviour that will only ever apply in Chromium.

[Mocha]: https://mochajs.org/
[Expect]: https://www.npmjs.com/package/expect
