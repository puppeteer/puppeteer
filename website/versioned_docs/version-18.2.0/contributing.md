---
sidebar_position: 4
---

# Contributing

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

## Getting Code

1. Clone this repository

```bash
git clone https://github.com/puppeteer/puppeteer
cd puppeteer
```

2. Install the dependencies

```bash
npm install
# Downloads the Firefox binary for Firefox tests
PUPPETEER_PRODUCT=firefox npm install
```

## Building Puppeteer

Puppeteer has two configurations for building:

- `npm run build` (or `npm run build:prod`) - Builds Puppeteer and artifacts
  used in production.
- `npm run build:test` - Builds Puppeteer, test runner, tests, and artifacts used in
  production.

## Testing Puppeteer

For browser testing, you can run

```bash
npm run build:test && npm run test
```

We also have other tests such as `test:types` that tests types and
`test:install` which tests installation. See the `package.json` for more tests
(all prefixed with `test`).

Puppeteer is using a custom test runner on top of Mocha that consults
the [TestExpectations.json](https://github.com/puppeteer/puppeteer/blob/main/test/TestExpectations.json)
to see if a given test result is expected or not. See more info about the test runner in [`tools/mochaRunner`](https://github.com/puppeteer/puppeteer/tree/main/tools/mochaRunner).

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Code Style

Our coding style is fully defined in
[`.eslintrc`](https://github.com/puppeteer/puppeteer/blob/main/.eslintrc.js)
([ESLint](https://eslint.org/)) and
[`.prettierrc.cjs`](https://github.com/puppeteer/puppeteer/blob/main/.prettierrc.cjs)
([Prettier](https://prettier.io)).

Code is checked during `pre-push` using
[Husky](https://typicode.github.io/husky/#/), but you can check your code
manually by running:

```bash
npm run lint
```

If some errors are returned, you can attempt to fix them using:

```bash
npm run format
```

## Project structure

The following is a description of the primary folders in Puppeteer:

- `src` - contains the source code for Puppeteer.
- `test/src` - contains the source code for Puppeteer tests.
- `utils`/`scripts` - contains various scripts.
- `tools/testserver` - contains the source code for our test servers in testing.
- `tools/mochaRunner` - contains the source code for our test runner.
- `compat` - contains code separated by module import type. See [`compat/README.md`](https://github.com/puppeteer/puppeteer/blob/main/compat/README.md) for details.
- `test-d` contains type tests using [`tsd`](https://github.com/SamVerschueren/tsd).
- `third_party` contains all dependencies that we vendor into the final build. See the [`third_party/README.md`](https://github.com/puppeteer/puppeteer/blob/main/third_party/README.md) for details.

### Shipping CJS and ESM bundles

Puppeteer ships both CommonJS and ES modules, therefore we maintain two `tsconfig` files for each project: `tsconfig.esm.json` and `tsconfig.cjs.json`. At build time we compile twice, once for CommonJS and once for ES modules.

We compile into the `lib` directory which is what we publish on the npm repository and it's structured like so:

```
lib
- cjs
  - puppeteer <== the output of compiling `src/tsconfig.cjs.json`
  - third_party <== the output of compiling `third_party/tsconfig.cjs.json`
- esm
  - puppeteer <== the output of compiling `src/tsconfig.esm.json`
  - third_party <== the output of compiling `third_party/tsconfig.json`
```

### `tsconfig.json` for the tests

We also maintain `test/tsconfig.json`. This is used to incrementally compile the unit test `*.spec.ts` files. Tests are run against the compiled code we ship to users so it gives us more confidence in our compiled output being correct.

### Root `tsconfig.json`

The root `tsconfig.json` exists for the API Extractor; it has to find a `tsconfig.json` in the project's root directory.

## API guidelines

When authoring new API methods, consider the following:

- Expose as little information as needed. When in doubt, don’t expose new information.
- Methods are used in favor of getters/setters.
  - The only exception is namespaces, e.g. `page.keyboard` and `page.coverage`
- All string literals must be small case. This includes event names and option values.
- Avoid adding "sugar" API (API that is trivially implementable in user-space) unless they're **very** demanded.

## Commit messages

Commit messages should follow [the Conventional Commits format](https://www.conventionalcommits.org/en/v1.0.0/#summary). This is enforced via `npm run commitlint`.

In particular, breaking changes should clearly be noted as “BREAKING CHANGE:” in the commit message footer. Example:

```
fix(page): fix page.pizza method

This patch fixes page.pizza so that it works with iframes.

Issues: #123, #234

BREAKING CHANGE: page.pizza now delivers pizza at home by default.
To deliver to a different location, use the "deliver" option:
  `page.pizza({deliver: 'work'})`.
```

## Writing documentation

Documentation is generated via `npm run docs`. It is automatically published to our documentation site on merge and gets versioned on release.

## Writing TSDoc comments

Each change to Puppeteer should be thoroughly documented using TSDoc comments. Refer to the [API Extractor documentation](https://api-extractor.com/pages/tsdoc/doc_comment_syntax/) for information on the exact syntax.

- Every new method needs to have either `@public` or `@internal` added as a tag depending on if it is part of the public API.
- Keep each line in a comment to no more than 90 characters (ESLint will warn you if you go over this). If you're a VSCode user the [Rewrap plugin](https://marketplace.visualstudio.com/items?itemName=stkb.rewrap) is highly recommended!

## Running the documentation site locally

1. At root, install all dependencies with `npm i`.
2. run `npm run docs` which will generate all the `.md` files on `puppeteer/docs/api`.
3. run `npm i` in `puppeteer/website`.
4. run `npm start` in `puppeteer/website`.

## Adding new dependencies

For all dependencies (both installation and development):

- **Do not add** a dependency if the desired functionality is easily implementable.
- If adding a dependency, it should be well-maintained and trustworthy.

A barrier for introducing new installation dependencies is especially high:

- **Do not add** installation dependency unless it's critical to project success.

There are additional considerations for dependencies that are environment agonistic. See the [`third_party/README.md`](https://github.com/puppeteer/puppeteer/blob/main/third_party/README.md) for details.

## Running & Writing Tests

- Every feature should be accompanied by a test.
- Every public api event/method should be accompanied by a test.
- Tests should not depend on external services.
- Tests should work on all three platforms: Mac, Linux and Win. This is especially important for screenshot tests.

Puppeteer tests are located in [the `test` directory](https://github.com/puppeteer/puppeteer/blob/main/test/) and are written using Mocha. See [`test/README.md`](https://github.com/puppeteer/puppeteer/blob/main/test/README.md) for more details.

The tests are making sure public API methods and events work as expected.

- To run all tests:

```bash
npm run test
```

- To run a specific test, substitute the `it` with `it.only`:

```ts
  ...
  it.only('should work', async function({server, page}) {
    const response = await page.goto(server.EMPTY_PAGE);
    expect(response.ok).toBe(true);
  });
```

- To disable a specific test, substitute the `it` with `it.skip`:

```ts
  ...
  // Using "it.skip" to skip specific test
  it.skip('should work', async function({server, page}) {
    const response = await page.goto(server.EMPTY_PAGE);
    expect(response.ok).toBe(true);
  });
```

- To run Chrome tests in non-headless mode:

```bash
npm run test:chrome:headful
```

- To run Firefox tests, firstly ensure you have Firefox installed locally (you only need to do this once, not on every test run) and then you can run the tests:

```bash
PUPPETEER_PRODUCT=firefox npm install
npm run test:firefox
```

- To run experimental Chromium MacOS ARM tests, firstly ensure you have correct Chromium version installed locally (you only need to do this once, not on every test run) and then you can run the tests:

```bash
PUPPETEER_EXPERIMENTAL_CHROMIUM_MAC_ARM=1 npm install
PUPPETEER_EXPERIMENTAL_CHROMIUM_MAC_ARM=1 npm run test:chrome:headless
```

- To run tests with custom browser executable:

```bash
BINARY=<path-to-executable> npm run test:chrome:headless # Or npm run test:firefox
```

If a test is expected to fail on certain configurations or became flaky, update [TestExpectations.json](https://github.com/puppeteer/puppeteer/blob/main/test/TestExpectations.json)
to reflect that. See more info about TestExpectations.json in [`tools/mochaRunner`](https://github.com/puppeteer/puppeteer/tree/main/tools/mochaRunner).

## API Coverage

Every public API method or event should be called at least once in tests. To ensure this, the main `test` command runs coverage during testing.

## Debugging Puppeteer

See [Debugging Tips](https://github.com/puppeteer/puppeteer/blob/main/README.md#debugging-tips) in the readme.

# For Project Maintainers

## Rolling new Chromium version

The following steps are needed to update the Chromium version.

1. Find a suitable Chromium revision
   Not all revisions have builds for all platforms, so we need to find one that does.
   To do so, run `tools/check_availability.js -rd` to find the latest suitable `dev` Chromium revision (see `tools/check_availability.js -help` for more options).
1. Update `src/revisions.ts` with the found revision number.
1. Update `versions.js` with the new Chromium-to-Puppeteer version mapping and update `lastMaintainedChromiumVersion` with the latest stable Chrome version.
1. Run `npm run check:protocol-revision`.
   If it fails, update `package.json` with the expected `devtools-protocol` version.
1. Run `npm run build && npm run build:test` and `npm install`.
1. Run `npm test` and ensure that all tests pass. If a test fails, [bisect](#bisecting-upstream-changes) the upstream cause of the failure, and either update the test expectations accordingly (if it was an intended change) or work around the changes in Puppeteer (if it’s not desirable to change Puppeteer’s observable behavior).
1. Commit and push your changes and open a pull request.
   The commit message must contain the version in `Chromium <version> (<revision>)` format to ensure that [pptr.dev](https://pptr.dev/) can parse it correctly, e.g. `'feat(chromium): roll to Chromium 90.0.4427.0 (r856583)'`.

### Bisecting upstream changes

Sometimes, performing a Chromium roll causes tests to fail. To figure out the cause, you need to bisect Chromium revisions to figure out the earliest possible revision that changed the behavior. The script in `tools/bisect.js` can be helpful here. Given a pattern for one or more unit tests, it will automatically bisect the current range:

```sh
node tools/bisect.js --good 686378 --bad 706915 script.js
node tools/bisect.js --unit-test Response.fromCache
```

By default, it will use the Chromium revision in `src/revisions.ts` from the `main` branch and from the working tree to determine the range to bisect.

## Releasing to npm

We use [release-please](https://github.com/googleapis/release-please) to automate releases. When a release should be done, check for the release PR in our [pull requests](https://github.com/puppeteer/puppeteer/pulls) and merge it.
