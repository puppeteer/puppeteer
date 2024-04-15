# Puppeteer Angular Schematic

Adds Puppeteer-based e2e tests to your Angular project.

## Getting started

Run the command below in an Angular CLI app directory and follow the prompts.

> Note this will add the schematic as a dependency to your project.

```bash
ng add @puppeteer/ng-schematics
```

Or you can use the same command followed by the [options](#options) below.

Currently, this schematic supports the following test runners:

- [**Jasmine**](https://jasmine.github.io/)
- [**Jest**](https://jestjs.io/)
- [**Mocha**](https://mochajs.org/)
- [**Node Test Runner**](https://nodejs.org/api/test.html)

With the schematics installed you can run E2E tests:

```bash
ng e2e
```

### Options

When adding schematics to your project you can to provide following options:

| Option          | Description                                            | Value                                      | Required |
| --------------- | ------------------------------------------------------ | ------------------------------------------ | -------- |
| `--test-runner` | The testing framework to install along side Puppeteer. | `"jasmine"`, `"jest"`, `"mocha"`, `"node"` | `true`   |

## Creating a single test file

Puppeteer Angular Schematic exposes a method to create a single test file.

```bash
ng generate @puppeteer/ng-schematics:e2e "<TestName>"
```

### Running test server and dev server at the same time

By default the E2E test will run the app on the same port as `ng start`.
To avoid this you can specify the port the an the `angular.json`
Update either `e2e` or `puppeteer` (depending on the initial setup) to:

```json
{
  "e2e": {
    "builder": "@puppeteer/ng-schematics:puppeteer",
    "options": {
      "commands": [...],
      "devServerTarget": "sandbox:serve",
      "testRunner": "<TestRunner>",
      "port": 8080
    },
    ...
}
```

Now update the E2E test file `utils.ts` baseUrl to:

```ts
const baseUrl = 'http://localhost:8080';
```

## Contributing

Check out our [contributing guide](https://pptr.dev/contributing) to get an overview of what you need to develop in the Puppeteer repo.

### Sandbox smoke tests

To make integration easier smoke test can be run with a single command, that will create a fresh install of Angular (single application and a milti application projects). Then it will install the schematics inside them and run the initial e2e tests:

```bash
node tools/smoke.mjs
```

### Unit Testing

The schematics utilize `@angular-devkit/schematics/testing` for verifying correct file creation and `package.json` updates. To execute the test suit:

```bash npm2yarn
npm run test
```

## Migrating from Protractor

### Entry point

Puppeteer has its own [`browser`](https://pptr.dev/api/puppeteer.browser) that exposes the browser process.
A more closes comparison for Protractor's `browser` would be Puppeteer's [`page`](https://pptr.dev/api/puppeteer.page).

```ts
// Testing framework specific imports

import {setupBrowserHooks, getBrowserState} from './utils';

describe('<Test Name>', function () {
  setupBrowserHooks();
  it('is running', async function () {
    const {page} = getBrowserState();
    // Query elements
    await page
      .locator('my-component')
      // Click on the element once found
      .click();
  });
});
```

### Getting element properties

You can easily get any property of the element.

```ts
// Testing framework specific imports

import {setupBrowserHooks, getBrowserState} from './utils';

describe('<Test Name>', function () {
  setupBrowserHooks();
  it('is running', async function () {
    const {page} = getBrowserState();
    // Query elements
    const elementText = await page
      .locator('.my-component')
      .map(button => button.innerText)
      // Wait for element to show up
      .wait();

    // Assert via assertion library
  });
});
```

### Query Selectors

Puppeteer supports multiple types of selectors, namely, the CSS, ARIA, text, XPath and pierce selectors.
The following table shows Puppeteer's equivalents to [Protractor By](https://www.protractortest.org/#/api?view=ProtractorBy).

> For improved reliability and reduced flakiness try our
> **Experimental** [Locators API](https://pptr.dev/guides/locators)

| By                | Protractor code                               | Puppeteer querySelector                                      |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------ |
| CSS (Single)      | `$(by.css('<CSS>'))`                          | `page.$('<CSS>')`                                            |
| CSS (Multiple)    | `$$(by.css('<CSS>'))`                         | `page.$$('<CSS>')`                                           |
| Id                | `$(by.id('<ID>'))`                            | `page.$('#<ID>')`                                            |
| CssContainingText | `$(by.cssContainingText('<CSS>', '<TEXT>'))`  | `page.$('<CSS> ::-p-text(<TEXT>)')` `                        |
| DeepCss           | `$(by.deepCss('<CSS>'))`                      | `page.$(':scope >>> <CSS>')`                                 |
| XPath             | `$(by.xpath('<XPATH>'))`                      | `page.$('::-p-xpath(<XPATH>)')`                              |
| JS                | `$(by.js('document.querySelector("<CSS>")'))` | `page.evaluateHandle(() => document.querySelector('<CSS>'))` |

> For advanced use cases such as Protractor's `by.addLocator` you can check Puppeteer's [Custom selectors](https://pptr.dev/guides/query-selectors#custom-selectors).

### Actions Selectors

Puppeteer allows you to all necessary actions to allow test your application.

```ts
// Click on the element.
element(locator).click();
// Puppeteer equivalent
await page.locator(locator).click();

// Send keys to the element (usually an input).
element(locator).sendKeys('my text');
// Puppeteer equivalent
await page.locator(locator).fill('my text');

// Clear the text in an element (usually an input).
element(locator).clear();
// Puppeteer equivalent
await page.locator(locator).fill('');

// Get the value of an attribute, for example, get the value of an input.
element(locator).getAttribute('value');
// Puppeteer equivalent
const element = await page.locator(locator).waitHandle();
const value = await element.getProperty('value');
```

### Example

Sample Protractor test:

```ts
describe('Protractor Demo', function () {
  it('should add one and two', function () {
    browser.get('http://juliemr.github.io/protractor-demo/');
    element(by.model('first')).sendKeys(1);
    element(by.model('second')).sendKeys(2);

    element(by.id('gobutton')).click();

    expect(element(by.binding('latest')).getText()).toEqual('3');
  });
});
```

Sample Puppeteer migration:

```ts
import {setupBrowserHooks, getBrowserState} from './utils';

describe('Puppeteer Demo', function () {
  setupBrowserHooks();
  it('should add one and two', function () {
    const {page} = getBrowserState();
    await page.goto('http://juliemr.github.io/protractor-demo/');

    await page.locator('.form-inline > input:nth-child(1)').fill('1');
    await page.locator('.form-inline > input:nth-child(2)').fill('2');
    await page.locator('#gobutton').fill('2');

    const result = await page
      .locator('.table tbody td:last-of-type')
      .map(header => header.innerText)
      .wait();

    expect(result).toEqual('3');
  });
});
```
