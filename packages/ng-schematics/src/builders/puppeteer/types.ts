/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {JsonObject} from '@angular-devkit/core';

import type {TestRunner} from '../../schematics/utils/types.js';

export interface PuppeteerBuilderOptions extends JsonObject {
  testRunner: TestRunner;
  devServerTarget: string;
  port: number | null;
}
