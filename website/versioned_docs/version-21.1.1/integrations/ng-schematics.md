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

| Option         | Description                                            | Value                                      | Required |
| -------------- | ------------------------------------------------------ | ------------------------------------------ | -------- |
| `--testRunner` | The testing framework to install along side Puppeteer. | `"jasmine"`, `"jest"`, `"mocha"`, `"node"` | `true`   |

## Creating a single test file

Puppeteer Angular Schematic exposes a method to create a single test file.

```bash
ng generate @puppeteer/ng-schematics:test "<TestName>"
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

### Sandbox

For easier development we provide a script to auto-generate the Angular project to test against. Simply run:

```bash
npm run sandbox -- --init
```

After that to run `@puppeteer/ng-schematics` against the Sandbox Angular project run:

```bash
npm run sandbox
# or to auto-build and then run schematics
npm run sandbox -- --build
```

To run the creating of single test schematic:

```bash
npm run sandbox:test
```

To create a multi project workspace use the following command

```bash
npm run sandbox -- --init --multi
```

### Unit Testing

The schematics utilize `@angular-devkit/schematics/testing` for verifying correct file creation and `package.json` updates. To execute the test suit:

```bash
npm run test
```

## Migrating from Protractor

### Browser

Puppeteer has its own [`browser`](https://pptr.dev/api/puppeteer.browser) that exposes different API compared to the one exposed by Protractor.

```ts
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();

  it('should work', () => {
    const page = await browser.newPage();

    // Query elements
    const element = await page.$('my-component');

    // Do actions
    await element.click();
  });

  await browser.close();
})();
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
