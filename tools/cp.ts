/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';

/**
 * Copies single file in argv[2] to argv[3]
 */
fs.cpSync(process.argv[2], process.argv[3]);
