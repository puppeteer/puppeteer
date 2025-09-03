/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Removes files in folder that match the glob pattern.
 *
 */
const targetDir = process.argv[2];
const glob = process.argv[3];
for await (const entry of fs.glob(glob, {
  cwd: targetDir,
})) {
  await fs.rm(path.join(targetDir, entry));
}
