/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {mkdirSync, writeFileSync} from 'fs';
import {dirname} from 'path';

/**
 * Outputs the dummy package.json file to the path specified
 * by the first argument.
 */
mkdirSync(dirname(process.argv[2]), {recursive: true});
writeFileSync(process.argv[2], `{"type": "module"}`);
