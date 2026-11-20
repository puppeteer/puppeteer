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

  it('should fallback to super.getProperties() for primitive handles without objectId', async () => {
    const evaluate = mock.fn(async () => {
      return [];
    });
    const world = {
      evaluate,
      environment: {client: {send: mock.fn(async () => {})} as any},
    } as unknown as IsolatedWorld;

    const handle = new CdpJSHandle(world, {type: 'number', value: 42}, () => {
      return undefined;
    });

    const properties = await handle.getProperties();
    expect(properties.size).toBe(0);
    expect(evaluate.mock.calls.length).toBe(1);
  });

  it('should request Runtime.getProperties when objectId is present', async () => {
    const send = mock.fn(
      async (_method?: string, _params?: Record<string, unknown>) => {
        return {
          result: [
            {
              name: 'foo',
              enumerable: true,
              value: {type: 'string', value: 'bar'},
            },
            {
              name: 'nonEnumerable',
              enumerable: false,
              value: {type: 'string', value: 'baz'},
            },
          ],
        };
      },
    );
    const client = {send} as any;
    const createCdpHandle = mock.fn((val: unknown) => {
      return val as any;
    });
    const world = {
      environment: {client},
      createCdpHandle,
    } as unknown as IsolatedWorld;

    const handle = new CdpJSHandle(
      world,
      {type: 'object', objectId: 'obj-42'},
      () => {
        return undefined;
      },
    );

    const properties = await handle.getProperties();
    expect(send.mock.calls.length).toBe(1);
    expect((send.mock.calls[0]?.arguments as any)[0]).toBe(
      'Runtime.getProperties',
    );
    expect((send.mock.calls[0]?.arguments as any)[1]).toEqual({
      objectId: 'obj-42',
      ownProperties: true,
    });
    expect(properties.size).toBe(1);
    expect(properties.has('foo')).toBe(true);
  });
});
