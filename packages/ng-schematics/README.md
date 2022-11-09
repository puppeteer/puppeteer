# Puppeteer Schematics Angular

This schematics provide a simple set up of Puppeteer for an Angular project.

## Usage

Run the command in an Angular CLI app directory.
_Note this will add the schematic as a dependency to your project._

```bash
ng add puppetter-schematics
```

With the schematics installed, you can run E2E tests with your chose:

```bash
npm run e2e
# or yarn e2e
```

### Unit Testing

The schematics utilize `@angular-devkit/schematics/testing` for verifying correct file creation and `package.json` updates. To execute the test suit:

```bash
npm run test
```
