#!/usr/bin/env node

/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {exec} from 'child_process';
import {readdirSync} from 'fs';

exec(
  `git clean -Xf ${readdirSync(process.cwd())
    .filter(file => {
      return file !== 'node_modules';
    })
    .join(' ')}`
);
