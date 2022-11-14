# Puppeteer Schematics Angular

An easy way to add testing with Puppeteer for you Angular project.

## Usage

Run the command bellow in an Angular CLI app directory and follow the prompts.
_Note this will add the schematic as a dependency to your project._

```bash
ng add @puppeteer/ng-schematics
```

Or you can use the same command followed by the options bellow.

Currently it support set-ups with **Jasmine**, **Jest**, **Mocha**, **Node Test Runner _[Experimental]_**.

With the schematics installed, you can run E2E tests:

```bash
npm run e2e
# or yarn e2e
```

##### Options

When adding WebdriverIO Schematics to your project you can invoke the following options:

| Option               | Description                                                                                            | Value                                      | Required |
| -------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------ | -------- |
| `--exportConfig`     | When true, creates an empty `.puppeteerrc.cjs` [configuration](https://pptr.dev/guides/configuration). | `boolean`                                  | `true`   |
| `--testingFramework` | The testing framework to install along side Puppeteer.                                                 | `"jasmine"`, `"jest"`, `"mocha"`, `"node"` | `true`   |

### Unit Testing

The schematics utilize `@angular-devkit/schematics/testing` for verifying correct file creation and `package.json` updates. To execute the test suit:

```bash
npm run test
```
