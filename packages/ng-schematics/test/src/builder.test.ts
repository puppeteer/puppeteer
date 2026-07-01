/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {getCommandsForOptions} from '../../lib/builders/puppeteer/index.js';
import {TestRunner} from '../../lib/schematics/utils/types.js';

void describe('@puppeteer/ng-schematics: builder', () => {
  void it('should use the configured test runner when custom commands are not provided', () => {
    expect(
      getCommandsForOptions({
        testRunner: TestRunner.Jest,
        devServerTarget: 'sandbox:serve',
        port: null,
        baseUrl: null,
        commands: null,
      }),
    ).toEqual([['jest', '-c', 'e2e/jest.config.js']]);
  });

  void it('should use custom commands when provided', () => {
    expect(
      getCommandsForOptions({
        testRunner: TestRunner.Jest,
        devServerTarget: 'sandbox:serve',
        port: null,
        baseUrl: null,
        commands: [
          [
            'node',
            '--inspect-brk',
            'node_modules/jest/bin/jest.js',
            '--runInBand',
            '-c',
            'e2e/jest.config.js',
          ],
        ],
      }),
    ).toEqual([
      [
        'node',
        '--inspect-brk',
        'node_modules/jest/bin/jest.js',
        '--runInBand',
        '-c',
        'e2e/jest.config.js',
      ],
    ]);
  });
});
