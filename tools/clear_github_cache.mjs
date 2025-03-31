/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

const prefix = process.argv[2];
if (!prefix) {
  throw new Error('Prefix must be specified');
}
try {
  await execAsync('gh --help');
} catch {
  console.log('Github CLI not set up');
  process.exit(0);
}

try {
  if (prefix === 'all') {
    execAsync(`gh cache delete --all`);
  } else {
    const c = await execAsync('gh cache list --limit=10000');
    const cacheKeys = c.stdout
      .split('\n')
      .map(line => {
        return line.replaceAll(/\s+/g, ' ').split(' ')[1];
      })
      .filter(line => {
        return line && line.startsWith(prefix);
      });

    Promise.all(
      cacheKeys.map(cacheKey => {
        return execAsync(`gh cache delete ${cacheKey}`);
      }),
    );
  }
} catch (error) {
  console.log(error);
  process.exit(0);
}
