# Puppeteer Angular Schematic

Adds Puppeteer-based e2e tests to your Angular project.

## Usage

Run the command below in an Angular CLI app directory and follow the prompts.
_Note this will add the schematic as a dependency to your project._

```bash
ng add @puppeteer/ng-schematics
```

Or you can use the same command followed by the [options](#options) below.

Currently, this schematic supports the following test frameworks:

- **Jasmine** [https://jasmine.github.io/]
- **Jest** [https://jestjs.io/]
- **Mocha** [https://mochajs.org/]
- **Node Test Runner** _(Experimental)_ [https://nodejs.org/api/test.html]

With the schematics installed you can run E2E tests:

```bash
ng e2e
```

> Note: Command spawns it's own server on the same port `ng serve` does.

## Options

When adding schematics to your project you can to provide following options:

| Option               | Description                                                                                                             | Value                                      | Required |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------- |
| `--isDefaultTester`  | When true, replaces default `ng e2e` command.                                                                           | `boolean`                                  | `true`   |
| `--exportConfig`     | When true, creates an empty [Puppeteer configuration](https://pptr.dev/guides/configuration) file. (`.puppeteerrc.cjs`) | `boolean`                                  | `true`   |
| `--testingFramework` | The testing framework to install along side Puppeteer.                                                                  | `"jasmine"`, `"jest"`, `"mocha"`, `"node"` | `true`   |

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

### Unit Testing

The schematics utilize `@angular-devkit/schematics/testing` for verifying correct file creation and `package.json` updates. To execute the test suit:

```bash
npm run test
```
