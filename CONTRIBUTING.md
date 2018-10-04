# How to Contribute

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

## Getting setup

1. Clone this repository

```bash
git clone https://github.com/GoogleChrome/puppeteer
cd puppeteer
```

2. Install dependencies

```bash
npm install
```

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Code Style

- Coding style is fully defined in [.eslintrc](https://github.com/GoogleChrome/puppeteer/blob/master/.eslintrc.js)
- Code should be annotated with [closure annotations](https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler).
- Comments should be generally avoided. If the code would not be understood without comments, consider re-writing the code to make it self-explanatory.

To run code linter, use:

```bash
npm run lint
```

## API guidelines

When authoring new API methods, consider the following:
- Expose as little information as needed. When in doubt, don’t expose new information.
- Methods are used in favor of getters/setters.
  - The only exception is namespaces, e.g. `page.keyboard` and `page.coverage`
- All string literals must be small case. This includes event names and option values.
- Avoid adding "sugar" API (API that is trivially implementable in user-space) unless they're **very** demanded.

## Commit Messages

Commit messages should follow the Semantic Commit Messages format:

```
label(namespace): title

description

footer
```

1. *label* is one of the following:
    - `fix` - puppeteer bug fixes.
    - `feat` - puppeteer features.
    - `docs` - changes to docs, e.g. `docs(api.md): ..` to change documentation.
    - `test` - changes to puppeteer tests infrastructure.
    - `style` - puppeteer code style: spaces/alignment/wrapping etc.
    - `chore` - build-related work, e.g. doclint changes / travis / appveyor.
2. *namespace* is put in parenthesis after label and is optional.
3. *title* is a brief summary of changes.
4. *description* is **optional**, new-line separated from title and is in present tense.
5. *footer* is **optional**, new-line separated from *description* and contains "fixes" / "references" attribution to github issues.
6. *footer* should also include "BREAKING CHANGE" if current API clients will break due to this change. It should explain what changed and how to get the old behavior.

Example:

```
fix(Page): fix page.pizza method

This patch fixes page.pizza so that it works with iframes.

Fixes #123, Fixes #234

BREAKING CHANGE: page.pizza now delivers pizza at home by default.
To deliver to a different location, use "deliver" option:
  `page.pizza({deliver: 'work'})`.
```

## Writing Documentation

All public API should have a descriptive entry in the [docs/api.md](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md). There's a [documentation linter](https://github.com/GoogleChrome/puppeteer/tree/master/utils/doclint) which makes sure documentation is aligned with the codebase.

To run documentation linter, use:

```bash
npm run doc
```

## Adding New Dependencies

For all dependencies (both installation and development):
- **Do not add** a dependency if the desired functionality is easily implementable.
- If adding a dependency, it should be well-maintained and trustworthy.

A barrier for introducing new installation dependencies is especially high:
- **Do not add** installation dependency unless it's critical to project success.

## Writing Tests

- Every feature should be accompanied by a test.
- Every public api event/method should be accompanied by a test.
- Tests should be *hermetic*. Tests should not depend on external services.
- Tests should work on all three platforms: Mac, Linux and Win. This is especially important for screenshot tests.

Puppeteer tests are located in [test/test.js](https://github.com/GoogleChrome/puppeteer/blob/master/test/test.js)
and are written with a [TestRunner](https://github.com/GoogleChrome/puppeteer/tree/master/utils/testrunner) framework.
Despite being named 'unit', these are integration tests, making sure public API methods and events work as expected.

- To run all tests:

```bash
npm run unit
```

- To run tests in parallel, use `-j` flag:

```bash
npm run unit -- -j 4
```

- To run a specific test, substitute the `it` with `fit` (mnemonic rule: '*focus it*'):

```js
  ...
  // Using "fit" to run specific test
  fit('should work', async function({server, page}) {
    const response = await page.goto(server.EMPTY_PAGE);
    expect(response.ok).toBe(true);
  })
```

- To disable a specific test, substitute the `it` with `xit` (mnemonic rule: '*cross it*'):

```js
  ...
  // Using "xit" to skip specific test
  xit('should work', async function({server, page}) {
    const response = await page.goto(server.EMPTY_PAGE);
    expect(response.ok).toBe(true);
  })
```

- To run tests in non-headless mode:

```bash
HEADLESS=false npm run unit
```

- To run tests with custom Chromium executable:

```bash
CHROME=<path-to-executable> npm run unit
```

- To run tests in slow-mode:

```bash
HEADLESS=false SLOW_MO=500 npm run unit
```

- To debug a test, "focus" a test first and then run:

```bash
node --inspect-brk test/test.js
```

## Public API Coverage

Every public API method or event should be called at least once in tests. To ensure this, there's a coverage command which tracks calls to public API and reports back if some methods/events were not called.

Run coverage:

```bash
npm run coverage
```

## Debugging Puppeteer

See [Debugging Tips](README.md#debugging-tips) in the readme.

## [For Project Maintainers] Releasing to NPM

Releasing to NPM consists of 3 phases:
1. Source Code: mark a release.
    1. Bump `package.json` version following the SEMVER rules and send a PR titled `'chore: mark version vXXX.YYY.ZZZ'` ([example](https://github.com/GoogleChrome/puppeteer/commit/808bf8e5582482a1d849ff22a51e52024810905c)).
    2. Make sure the PR passes **all checks**.
        - **WHY**: there are linters in place that help to avoid unnecessary errors, e.g. [like this](https://github.com/GoogleChrome/puppeteer/pull/2446)
    3. Merge the PR.
    4. Once merged, publish release notes using the "create new tag" option.
        - **NOTE**: tag names are prefixed with `'v'`, e.g. for version `1.4.0` tag is `v1.4.0`.
2. Publish `puppeteer` to NPM.
    1. On your local machine, pull from [upstream](https://github.com/GoogleChrome/puppeteer) and make sure the last commit is the one just merged.
    2. Run `git status` and make sure there are no untracked files.
        - **WHY**: this is to avoid bundling unnecessary files to NPM package
    3. Run [`pkgfiles`](https://www.npmjs.com/package/pkgfiles) to make sure you don't publish anything unnecessary.
    4. Run `npm publish`. This will publish `puppeteer` package.
3. Publish `puppeteer-core` to NPM.
    1. Run `./utils/prepare_puppeteer_core.js`. The script will change the name inside `package.json` to `puppeteer-core`.
    2. Run `npm publish`. This will publish `puppeteer-core` package.
    3. Run `git reset --hard` to reset the changes to `package.json`.
4. Source Code: mark post-release.
    1. Bump `package.json` version to `-post` version and send a PR titled `'chore: bump version to vXXX.YYY.ZZZ-post'` ([example](https://github.com/GoogleChrome/puppeteer/commit/d02440d1eac98028e29f4e1cf55413062a259156))
        - **NOTE**: make sure to update the "released APIs" section in the top of `docs/api.md`.
        - **NOTE**: no other commits should be landed in-between release commit and bump commit.

