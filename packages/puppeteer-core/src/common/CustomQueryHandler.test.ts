/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {CustomQueryHandlerRegistry} from './CustomQueryHandler.js';
import {scriptInjector} from './ScriptInjector.js';

describe('CustomQueryHandlerRegistry', () => {
  it('clear should remove the registration scripts', () => {
    const registry = new CustomQueryHandlerRegistry();
    registry.register('clearedHandler', {
      queryOne: () => {
        return null;
      },
    });
    registry.clear();

    let script = '';
    scriptInjector.inject(source => {
      script = source;
    }, true);
    expect(script.includes('clearedHandler')).toBe(false);
  });
});
