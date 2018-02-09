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

- coding style is fully defined in [.eslintrc](https://github.com/GoogleChrome/puppeteer/blob/master/.eslintrc.js)
- code should be annotated with [closure annotations](https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler)
- comments should be generally avoided. If the code would not be understood without comments, consider re-writing the code to make it self-explanatory

To run code linter, use:

```bash
npm run lint
```

## API guidelines

When authoring new API methods, consider the following:
- expose as little information as needed. When in doubt, don’t expose new information
- methods are used in favor of getters/setters
  - the only exception is namespaces, e.g. `page.keyboard` and `page.coverage`
- all string literals must be small case. This includes event names and option values
- avoid adding "sugar" API (API that is trivially implementable in user-space) unless they're **very** demanded

## Commit Messages

Commit messages should follow the Semantic Commit Messages format:

```
label(namespace): title

description

footer
```

1. *label* is one of the following:
    - `fix` - puppeteer bug fixes
    - `feat` - puppeteer features
    - `docs` - changes to docs, e.g. `docs(api.md): ..` to change documentation
    - `test` - changes to puppeteer tests infrastructure
    - `style` - puppeteer code style: spaces/alignment/wrapping etc
    - `chore` - build-related work, e.g. doclint changes / travis / appveyor
2. *namespace* is put in parenthesis after label and is optional
3. *title* is a brief summary of changes
4. *description* is **optional**, new-line separated from title and is in present tense
5. *footer* is **optional**, new-line separated from *description* and contains "fixes" / "references" attribution to github issues
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

To run documentation linter, use

```bash
npm run doc
```

## Adding New Dependencies

For all dependencies (both installation and development):
- **Do not add** a dependency if the desired functionality is easily implementable
- if adding a dependency, it should be well-maintained and trustworthy

A barrier for introducing new installation dependencies is especially high:
- **Do not add** installation dependency unless it's critical to project success

## Writing Tests

- every feature should be accompanied by a test
- every public api event/method should be accompanied by a test
- tests should be *hermetic*. Tests should not depend on external services.
- tests should work on all three platforms: Mac, Linux and Win. This is especially important for screenshot tests.

Puppeteer tests are located in [test/test.js](https://github.com/GoogleChrome/puppeteer/blob/master/test/test.js)
and are written with a [TestRunner](https://github.com/GoogleChrome/puppeteer/tree/master/utils/testrunner) framework.
Despite being named 'unit', these are integration tests, making sure public API methods and events work as expected.

- To run all tests:

```bash
npm run unit
```

- To filter tests by name:

```bash
npm run unit --filter=waitFor
```

- To run tests in parallel, use `-j` flag:

```bash
npm run unit -- -j 4
```

- To run a specific test, substitute the `it` with `fit` (mnemonic rule: '*focus it*'):

```js
  ...
  // Using "fit" to run specific test
  fit('should work', SX(async function() {
    const response = await page.goto(EMPTY_PAGE);
    expect(response.ok).toBe(true);
  }))
```

- To disable a specific test, substitute the `it` with `xit` (mnemonic rule: '*cross it*'):

```js
  ...
  // Using "xit" to skip specific test
  xit('should work', SX(async function() {
    const response = await page.goto(EMPTY_PAGE);
    expect(response.ok).toBe(true);
  }))
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

See [Debugging Tips](README.md#debugging-tips) in the readme
