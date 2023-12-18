/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: this could be an eslint rule probably.
import fs from 'fs';
import path from 'path';
import url from 'url';

import prettier from 'prettier';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const source = 'test/TestExpectations.json';
const testExpectations = JSON.parse(fs.readFileSync(source, 'utf-8'));
const committedExpectations = structuredClone(testExpectations);

const prettierConfig = await import(
  path.join(__dirname, '..', '.prettierrc.cjs')
);

function getSpecificity(item) {
  return (
    item.parameters.length +
    (item.testIdPattern.includes('*')
      ? item.testIdPattern === '*'
        ? 0
        : 1
      : 2)
  );
}

testExpectations.sort((a, b) => {
  const result = getSpecificity(a) - getSpecificity(b);
  if (result === 0) {
    return a.testIdPattern.localeCompare(b.testIdPattern);
  }
  return result;
});

testExpectations.forEach(item => {
  item.parameters.sort();
  item.expectations.sort();
  item.platforms.sort();
});

if (process.argv.includes('--lint')) {
  if (
    JSON.stringify(committedExpectations) !== JSON.stringify(testExpectations)
  ) {
    console.error(
      `${source} is not formatted properly. Run 'npm run format:expectations'.`
    );
    process.exit(1);
  }
} else {
  fs.writeFileSync(
    source,
    await prettier.format(JSON.stringify(testExpectations), {
      ...prettierConfig,
      parser: 'json',
    })
  );
}
