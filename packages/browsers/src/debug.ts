/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {debuglog} from 'node:util';

export const DEBUG_PREFIXES = {
  cache: 'puppeteer:browsers:cache',
  fileUtil: 'puppeteer:browsers:fileUtil',
  install: 'puppeteer:browsers:install',
  launcher: 'puppeteer:browsers:launcher',
} as const;

export type LoggerFunction = (...args: unknown[]) => void;
export type Logger = (prefix: string) => LoggerFunction | undefined;

export const debug = (prefix: string): LoggerFunction | undefined => {
  const log = debuglog(prefix);
  return log.enabled ? (log as unknown as LoggerFunction) : undefined;
};
