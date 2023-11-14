/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
