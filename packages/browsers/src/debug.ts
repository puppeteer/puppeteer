/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {debuglog} from 'node:util';

export const debug = (
  prefix: string,
): ((msg: string, ...param: unknown[]) => void) | undefined => {
  const log = debuglog(prefix);
  return log.enabled ? log : undefined;
};
