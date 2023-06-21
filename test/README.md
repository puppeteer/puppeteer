# Puppeteer tests

Unit tests in Puppeteer are written using [Mocha] as the test runner and [Expect] as the assertions library.

## Test state

We have some common setup that runs before each test and is defined in `mocha-utils.js`.

You can use the `getTestState` function to read state. It exposes the following that you can use in your tests. These will be reset/tidied between tests automatically for you:

- `puppeteer`: an instance of the Puppeteer library. This is exactly what you'd get if you ran `require('puppeteer')`.
- `puppeteerPath`: the path to the root source file for Puppeteer.
- `defaultBrowserOptions`: the default options the Puppeteer browser is launched from in test mode, so tests can use them and override if required.
- `server`: a dummy test server instance (see `packages/testserver` for more).
- `httpsServer`: a dummy test server HTTPS instance (see `packages/testserver` for more).
- `isFirefox`: true if running in Firefox.
- `isChrome`: true if running Chromium.
- `isHeadless`: true if the test is in headless mode.

If your test needs a browser instance, you can use the `setupTestBrowserHooks()` function which will automatically configure a browser that will be cleaned between each test suite run. You access this via `getTestState()`.

If your test needs a Puppeteer page and context, you can use the `setupTestPageAndContextHooks()` function which will configure these. You can access `page` and `context` from `getTestState()` once you have done this.

The best place to look is an existing test to see how they use the helpers.

## Skipping tests in specific conditions

To skip tests edit the [TestExpectations](https://github.com/puppeteer/puppeteer/blob/main/test/TestExpectations.json) file. See [test runner documentation](https://github.com/puppeteer/puppeteer/tree/main/tools/mochaRunner) for more details.

## Running tests

- To run all tests applicable for your platform:

```bash
npm test
```

- **Important**: don't forget to first build the code if you're testing local changes:

```bash
npm run build --workspace=@puppeteer-test/test && npm test
```

### CLI options

| Description                                                       | Option           | Type    |
| ----------------------------------------------------------------- | ---------------- | ------- |
| Do not generate coverage report                                   | --no-coverage    | boolean |
| Do not generate suggestion for updating TestExpectation.json file | --no-suggestions | boolean |
| Specify a file to which to save run data                          | --save-stats-to  | string  |
| Specify a file with a custom Mocha reporter                       | --reporter       | string  |
| Number of times to retry failed tests.                            | --retries        | number  |
| Timeout threshold value.                                          | --timeout        | number  |
| Tell Mocha to not run test files in parallel                      | --no-parallel    | boolean |
| Generate full stacktrace upon failure                             | --fullTrace      | boolean |
| Name of the Test suit defined in TestSuites.json                  | --test-suite     | string  |

### Helpful information

- To run a specific test, substitute the `it` with `it.only`:

```ts
  ...
  it.only('should work', async function() {
    const {server, page} = await getTestState();
    const response = await page.goto(server.EMPTY_PAGE);
    expect(response.ok).toBe(true);
  });
```

- To disable a specific test, substitute the `it` with `it.skip`:

```ts
  ...
  it.skip('should work', async function({server, page}) {
    const {server, page} = await getTestState();
    const response = await page.goto(server.EMPTY_PAGE);
    expect(response.ok).toBe(true);
  });
```

- To run Chrome headful tests:

```bash
npm run test:chrome:headful
```

- To run tests with custom browser executable:

```bash
BINARY=<path-to-executable> npm run test:chrome:headless # Or npm run test:firefox
```

[mocha]: https://mochajs.org/
[expect]: https://www.npmjs.com/package/expect
