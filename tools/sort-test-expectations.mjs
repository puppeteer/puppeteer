/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: this could be an eslint rule probably.
import fs from 'fs';
import path from 'path';
import url from 'url';

import prettier from 'prettier';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const source = 'test/TestExpectations.json';
let testExpectations = JSON.parse(fs.readFileSync(source, 'utf-8'));
const committedExpectations = structuredClone(testExpectations);

function testIdMatchesExpectationPattern(title, pattern) {
  const patternRegExString = pattern
    // Replace `*` with non special character
    .replace(/\*/g, '--STAR--')
    // Escape special characters https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Replace placeholder with greedy match
    .replace(/--STAR--/g, '(.*)?');
  // Match beginning and end explicitly
  const patternRegEx = new RegExp(`^${patternRegExString}$`);
  return patternRegEx.test(title);
}

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
  // Delete comments for PASS expectations. They are likely outdated.
  if (item.expectations.length === 1 && item.expectations[0] === 'PASS') {
    delete item.comment;
  }
});

function isSubset(superset, subset) {
  let isSubset = true;

  for (const p of subset) {
    if (!superset.has(p)) {
      isSubset = false;
    }
  }

  return isSubset;
}

const toBeRemoved = new Set();
for (let i = testExpectations.length - 1; i >= 0; i--) {
  const expectation = testExpectations[i];
  const params = new Set(expectation.parameters);
  const expectations = new Set(expectation.expectations);
  const platforms = new Set(expectation.platforms);

  let foundMatch = false;
  for (let j = i - 1; j >= 0; j--) {
    const candidate = testExpectations[j];
    const candidateParams = new Set(candidate.parameters);
    const candidateExpectations = new Set(candidate.expectations);
    const candidatePlatforms = new Set(candidate.platforms);

    if (
      testIdMatchesExpectationPattern(
        expectation.testIdPattern,
        candidate.testIdPattern
      ) &&
      isSubset(candidatePlatforms, platforms) &&
      (isSubset(params, candidateParams) || isSubset(candidateParams, params))
    ) {
      foundMatch = true;
      if (isSubset(candidateExpectations, expectations)) {
        console.log('removing', expectation, 'already covered by', candidate);
        toBeRemoved.add(expectation);
      }
      break;
    }
  }

  if (!foundMatch && isSubset(new Set(['PASS']), expectations)) {
    console.log(
      'removing',
      expectation,
      'because the default expectation is to pass'
    );
    toBeRemoved.add(expectation);
  }
}

testExpectations = testExpectations.filter(item => {
  return !toBeRemoved.has(item);
});

if (process.argv.includes('--lint')) {
  const missingComments = [];
  testExpectations.forEach(item => {
    if (item.expectations.length === 1 && item.expectations[0] === 'PASS') {
      return;
    }
    if (!item.comment) {
      missingComments.push(item);
    }
  });

  if (
    JSON.stringify(committedExpectations) !== JSON.stringify(testExpectations)
  ) {
    console.error(
      `${source} is not formatted properly. Run 'npm run format:expectations'.`
    );
    process.exit(1);
  }

  if (missingComments.length > 0) {
    console.error(
      `${source}: missing comments for the following expectations:`,
      missingComments
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
