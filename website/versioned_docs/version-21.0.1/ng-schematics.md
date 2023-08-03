# Puppeteer Angular Schematic

Adds Puppeteer-based e2e tests to your Angular project.

## Getting started

Run the command below in an Angular CLI app directory and follow the prompts.

> Note this will add the schematic as a dependency to your project.

```bash
ng add @puppeteer/ng-schematics
```

Or you can use the same command followed by the [options](#options) below.

Currently, this schematic supports the following test frameworks:

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

| Option               | Description                                                                                                             | Value                                      | Required |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------- |
| `--isDefaultTester`  | When true, replaces default `ng e2e` command.                                                                           | `boolean`                                  | `true`   |
| `--exportConfig`     | When true, creates an empty [Puppeteer configuration](https://pptr.dev/guides/configuration) file. (`.puppeteerrc.cjs`) | `boolean`                                  | `true`   |
| `--testingFramework` | The testing framework to install along side Puppeteer.                                                                  | `"jasmine"`, `"jest"`, `"mocha"`, `"node"` | `true`   |
| `--port`             | The port to spawn server for E2E. If default is used `ng serve` and `ng e2e` will not run side-by-side.                 | `number`                                   | `4200`   |

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
      "testingFramework": "<TestingFramework>",
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

### Unit Testing

The schematics utilize `@angular-devkit/schematics/testing` for verifying correct file creation and `package.json` updates. To execute the test suit:

```bash
npm run test
```
