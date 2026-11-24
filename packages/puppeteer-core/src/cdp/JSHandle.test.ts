/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it, mock} from 'node:test';

import expect from 'expect';

import type {IsolatedWorld} from './IsolatedWorld.js';
import {CdpJSHandle} from './JSHandle.js';

describe('CdpJSHandle', () => {
  it('should throw if getProperties() is called on a disposed handle', async () => {
    const send = mock.fn(async () => {});
    const client = {send} as any;
    const world = {
      environment: {client},
    } as unknown as IsolatedWorld;

    const handle = new CdpJSHandle(
      world,
      {type: 'object', objectId: 'obj-1'},
      () => {
        return undefined;
      },
    );

    await handle.dispose();
    expect(handle.disposed).toBe(true);

    expect(() => {
      void handle.getProperties();
    }).toThrow('Attempted to use disposed CdpJSHandle.');
  });
});
