/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';

/**
 * Calls chmod with the mode in argv[2] on paths in argv[3...length-1].
 */
const mode = process.argv[2];

for (let i = 3; i < process.argv.length; i++) {
  fs.chmodSync(process.argv[i], mode);
}
