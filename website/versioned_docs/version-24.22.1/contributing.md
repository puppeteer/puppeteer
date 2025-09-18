# Contributing

First of all, thank you for your interest in Puppeteer! We'd love to accept your
patches and contributions!

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution,
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to &lt;[https://cla.developers.google.com/](https://cla.developers.google.com/)&gt; to see
your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

## Getting started

1. Clone this repository

   ```bash
   git clone https://github.com/puppeteer/puppeteer
   cd puppeteer
   ```

   or

   [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=90796663&machine=standardLinux32gb&devcontainer_path=.devcontainer%2Fdevcontainer.json)

2. Install the dependencies

   ```bash
   npm install
   # Or to download Firefox by default
   PUPPETEER_BROWSER=firefox npm install
   ```

3. Build all packages

   ```bash
   npm run build
   ```

4. Run all tests

   ```bash
   npm test
   ```

## Building a single package

To build a single package, you can run:

```bash
npm run build --workspace <package> # e.g. puppeteer
```

This will build all dependent packages automatically, so specifying a single
package is sufficient. This is all possible due to
[wireit](https://github.com/google/wireit) which behaves similar to
[GNU Make](https://www.gnu.org/software/make/).

### Watch mode

To continuously build a package, you can run:

```bash
npm run build --watch --workspace <package> # e.g. puppeteer
```

You have to only specify a single package to watch else things will not work as expected
As stated above because of [wireit](https://github.com/google/wireit) when a change happens
all dependencies will be build or rebuild (if needed).

## Removing stale artifacts

It's possible some generated artifacts (such as
`packages/puppeteer-core/src/types.ts`) can become stale since these artifacts
rely on complex conditions (such as names of distinct files) that cannot be
captured by the build system. To clean artifacts, you can run

```bash
npm run clean
# or specify the package
npm run clean --workspace <package>
```

## Comprehensive testing

Outside of `npm test`, there are several other
[`npm` scripts](https://docs.npmjs.com/cli/using-npm/scripts) that are
usually check through CI:

- `test-install` - Tests whether `puppeteer` and `puppeteer-core` install
  properly and are functional.
- `test-types` - Tests the TypeScript types in `puppeteer` using
  [`tsd`](https://github.com/SamVerschueren/tsd).
- `test:chrome:**` - Tests `puppeteer` on Chrome.
- `test:firefox:**` - Tests `puppeteer` on Firefox.
- `unit` - Runs unit tests.

The default `npm test` runs `test:{chrome,firefox}:headless` which is generally
sufficient.

Puppeteer uses a custom test runner on top of Mocha that consults the
[TestExpectations.json](https://github.com/puppeteer/puppeteer/blob/main/test/TestExpectations.json)
to see if a given test result is expected or not. See more info about the test
runner in
[`tools/mocha-runner`](https://github.com/puppeteer/puppeteer/tree/main/tools/mocha-runner).

### Unit tests

Tests that only test code (without the running browser) are put next to the classes they test
and run using the Node test runner (requires Node 20+):

```bash
npm run unit
```

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Code Style

Our coding style is fully defined in
[`eslint.config`](https://github.com/puppeteer/puppeteer/blob/main/eslint.config.mjs)
([ESLint](https://eslint.org/)) and
[`.prettierrc.cjs`](https://github.com/puppeteer/puppeteer/blob/main/.prettierrc.cjs)
([Prettier](https://prettier.io)).

Code is checked for PRs automatically and you can check your code
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

- `packages` contains all public source code.
- `test` contains all test source code.
- `test-d` contains type tests using
  [`tsd`](https://github.com/SamVerschueren/tsd).
- `tools` contains miscellaneous scripts that are used in building and etc.
- `tools/mocha-runner` - contains the source code for our test runner.

## API guidelines

When authoring new API methods, consider the following:

- Expose as little information as needed. When in doubt, don’t expose new
  information.
- Methods are used in favor of getters/setters.
  - The only exception is namespaces, e.g. `page.keyboard` and `page.coverage`
- All string literals must be small case. This includes event names and option
  values.
- Avoid adding "sugar" API (API that is trivially implementable in user-space)
  unless they're **extremely** demanded.

## Commit messages

Commit messages should follow
[the Conventional Commits format](https://www.conventionalcommits.org/en/v1.0.0/#summary).

In particular, breaking changes should clearly be noted as “BREAKING CHANGE:” in
the commit message footer. Example:

```
fix(page): fix page.pizza method

This patch fixes page.pizza so that it works with iframes.

Issues: #123, #234

BREAKING CHANGE: page.pizza now delivers pizza at home by default.
To deliver to a different location, use the "deliver" option:
  `page.pizza({deliver: 'work'})`.
```

## Writing documentation

Documentation is generated from TSDoc comments via `npm run docs`. It is automatically
published to our documentation site on merge and gets versioned on release.

This means that you should not change the markdown in files `docs/api` manually.

## Writing TSDoc comments

Each change to Puppeteer should be thoroughly documented using TSDoc comments.
Refer to the
[API Extractor documentation](https://api-extractor.com/pages/tsdoc/doc_comment_syntax/)
for information on the exact syntax.

- Every new method needs to have either `@public` or `@internal` added as a tag
  depending on if it is part of the public API.
- Keep each line in a comment to no more than 90 characters (ESLint will warn
  you if you go over this). If you're a VSCode user the
  [Rewrap plugin](https://marketplace.visualstudio.com/items?itemName=stkb.rewrap)
  is highly recommended!

## Running the documentation site locally

1. At root, install all dependencies with `npm i --ignore-scripts`.
2. run `npm run docs` which will generate all the `.md` files on
   `puppeteer/docs/api`.
3. run `npm i` in `puppeteer/website`.
4. run `npm start` in `puppeteer/website`.

## Adding new dependencies

For all dependencies (both installation and development):

- **Do not add** a dependency if the desired functionality is easily
  implementable.
- If adding a dependency, it should be well-maintained and trustworthy.

A barrier for introducing new installation dependencies is especially high:

- **Do not add** installation dependency unless it's critical to project
  success.

There are additional considerations for dependencies that are environment
agonistic. See the
[`third_party/README.md`](https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer-core/third_party/README.md)
for details.

## Testing tips

- Every feature should be accompanied by a test.
- Every public api event/method should be accompanied by a test.
- Tests should not depend on external services.
- Tests should work on all three platforms: Mac, Linux and Win. This is
  especially important for screenshot tests.

If a test is expected to fail on certain configurations or became flaky, update
[TestExpectations.json](https://github.com/puppeteer/puppeteer/blob/main/test/TestExpectations.json)
to reflect that. See more info about TestExpectations.json in
[`tools/mocha-runner`](https://github.com/puppeteer/puppeteer/tree/main/tools/mocha-runner).

## API Coverage

Every public API method or event should be called at least once in tests. To
ensure this, the main `test` command runs coverage during testing.

## Debugging Puppeteer

See [Debugging Tips](https://pptr.dev/guides/debugging).

### Debugging Puppeteer tests via VSCode

Copy the provided default `.vscode/launch.template.json` to `.vscode/launch.json` and then use the integrated VSCode debugger to debug test.

Remember to build test before launching via:

```bash
npm run build --workspace @puppeteer-test/test
```

# For Project Maintainers

## Rolling new Chrome version

There is a [GitHub action](https://github.com/puppeteer/puppeteer/blob/main/.github/workflows/update-browser-pins.yml) that runs once per day.
The action has a manual trigger that can be found on the [Actions Tab](https://github.com/puppeteer/puppeteer/actions/workflows/update-browser-pins.yml).

### Manual instructions

You can run the [`tools/update_browser_revision.mjs`](https://github.com/puppeteer/puppeteer/blob/main/tools/update_browser_revision.mjs) locally
and try see if any changes need to be committed.

> Note: You may need to run `node --experimental-fetch tools/update_browser_revision.mjs` as the script relies on `fetch`

The following steps are manual version of the script above.

1. Find a suitable Chrome `revision` and `version` via https://googlechromelabs.github.io/chrome-for-testing/ or https://chromiumdash.appspot.com/.
2. Update `packages/puppeteer-core/src/revisions.ts` with the found `version`
   number.
3. Update `versions.json` with the new Chrome-to-Puppeteer `version` mapping and
   update `lastMaintainedChromeVersion` with the next one in from the list.
4. Run `npm run check`. If it fails, update
   `packages/puppeteer-core/package.json`
   with the expected `devtools-protocol` version and run `npm install` to generate an updated `package-lock.json`.
5. Run `npm run clean`, `npm install` and `npm run build`.
6. Run `npm test` and ensure that all tests pass. If a test fails,
   [bisect](#bisecting-upstream-changes) the upstream cause of the failure, and
   either update the test expectations accordingly (if it was an intended
   change) or work around the changes in Puppeteer (if it’s not desirable to
   change Puppeteer’s observable behavior).
7. Commit and push your changes and open a pull request. The commit message must
   contain the version in `Chrome <version>` format to ensure
   that [pptr.dev](https://pptr.dev/) can parse it correctly, e.g.
   `feat(chrome): roll to Chrome 90.0.4427.0`.

### Bisecting upstream changes

For bisecting Chrome/Chromium changes use https://www.chromium.org/developers/bisect-builds-py/.

```bash
python3 <path-to-chromium-checkout>/tools/bisect-builds.py -g <known-good> -b <known-bad> -cft -v --verify-range --not-interactive -c "BINARY=%p npm run test:chrome:<test-type>"
```

Or run the wrapper in `tools/bisect.mjs` that warps the above functionality for Puppeteer tests.

```bash
# From Puppeteer repo root
node tools/bisect.mjs -g <known-good> -b <known-bad>
```

## Releasing to npm

We use [release-please](https://github.com/googleapis/release-please) to
automate releases. When a release should be done, check for the release PR in
our [pull requests](https://github.com/puppeteer/puppeteer/pulls) and merge it.

### In case Release Please fails

<!-- TODO: Remove once release-please is fixed -->

In the event release-please fails, the following needs to be done:

1. Update anything missing in the CHANGELOG of every package that was supposed
   to be published. For example, if the header is missing, you may need to add
   - For puppeteer:

     ```md
     ## [{NEW_VERSION}](https://github.com/puppeteer/puppeteer/compare/v{PREVIOUS_VERSION}...v{NEW_VERSION}) ({CURRENT_DATE})`
     ```

   - For other packages:

     ```md
     ## [{NEW_VERSION}](https://github.com/puppeteer/puppeteer/compare/{PACKAGE_FOLDER_NAME}-v{PREVIOUS_VERSION}...{PACKAGE_FOLDER_NAME}-v{NEW_VERSION}) ({CURRENT_DATE})
     ```

2. Create a GitHub release for each package, following the practice of previous
   releases.

## Bug triage guidelines

[Check incoming bug reports](https://github.com/puppeteer/puppeteer/issues) that do not have a `confirmed` or `needs-feedback` label:

1. Make sure the issue is labeled as either `bug` or `feature`.
2. If the issue does not have a clear repro or you cannot repro, ask for the repro and set the `needs-feedback` label.
3. Follow-up on the issues you previously asked for a feedback on (you should get a notification on GitHub when the user responds).
4. If the user does not provide feedback, the issue will be closed by the stale bot eventually.
5. If you are able to reproduce the issue, add the label `confirmed`.
6. If the bug is on the Chromium side, create a corresponding crbug.com issue, label the GitHub issue with the `upstream` label, and post a link to crbug.com in the comments.
7. If the issue is not related to either Puppeteer or Chromium, close the issue.
8. If the issue is about missing/incorrect documentation, label it as `documentation`.

Issues with PDFs:

1. If the issue reproduces using the regular print dialog and/or headful, [file a crbug.com against the `Blink>Layout` component](https://bugs.chromium.org/p/chromium/issues/entry?components=Blink%3ELayout).
2. If the issue is specific to Headless mode, [file an issue on crbug.com against the `Internals>Headless` component](https://bugs.chromium.org/p/chromium/issues/entry?components=Internals%3EHeadless).
