/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import {debuglog} from 'node:util';

import {environment} from './environment.js';

environment.value = {
  fs,
  path,
  debuglog,
  ScreenRecorder: environment.value.ScreenRecorder,
};
