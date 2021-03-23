# DocLint

**Doclint** is a small program that lints Puppeteer's documentation against Puppeteer's source code.

Doclint works in a few steps:

1. Read sources in `lib/` folder, parse AST trees and extract public API. Note that we run DocLint on the outputted JavaScript in `lib/` rather than the source code in `src/`. We will do this until we have migrated `src/` to be exclusively TypeScript and then we can update DocLint to support TypeScript.
2. Read sources in `docs/` folder, render markdown to HTML, use puppeteer to traverse the HTML and extract described API.
3. Compare one API to another.

Doclint is also responsible for general markdown checks, most notably for the table of contents relevancy.

## Running

```bash
npm run doc
```

## Tests

Doclint has its own set of jasmine tests, located at `utils/doclint/test` folder.

To execute tests, run:

```bash
npm run test-doclint
```
