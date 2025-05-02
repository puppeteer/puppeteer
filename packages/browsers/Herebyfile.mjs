/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {mkdir, readFile, writeFile} from 'fs/promises';

import {task} from 'hereby';

export const generateVersionTask = task({
  name: 'generate:version',
  run: async () => {
    const {version} = JSON.parse(await readFile('package.json', 'utf8'));
    await mkdir('src/generated', {recursive: true});
    await writeFile(
      'src/generated/version.ts',
      (await readFile('src/templates/version.ts.tmpl', 'utf8')).replace(
        'PACKAGE_VERSION',
        version,
      ),
    );
  },
});
