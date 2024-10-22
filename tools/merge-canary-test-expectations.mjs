/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Modifies test/TestExpectations.json in place.

import fs from 'fs';

const source = 'test/TestExpectations.json';
const testExpectations = JSON.parse(fs.readFileSync(source, 'utf-8'));
const canaryTestExpectations = JSON.parse(
  fs.readFileSync('test/CanaryTestExpectations.json', 'utf-8'),
);

fs.writeFileSync(
  source,
  JSON.stringify([...testExpectations, ...canaryTestExpectations], null, 2),
);
