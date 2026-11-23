/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import type {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';
import expect from 'expect';

import {CDPSession, CDPSessionEvent} from '../api/CDPSession.js';
import type {Connection} from '../cdp/Connection.js';
import {TargetCloseError} from '../common/Errors.js';
import {Deferred} from '../util/Deferred.js';

import {Tracing} from './Tracing.js';

class MockCDPSession extends CDPSession {
  commands: Array<{method: string; params?: unknown}> = [];
  onSend?: (method: string, params?: unknown) => Promise<unknown>;

  override id(): string {
    return 'mock-id';
  }

  override connection(): Connection | undefined {
    return undefined;
  }

  override get detached(): boolean {
    return false;
  }

  override async send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    params?: ProtocolMapping.Commands[T]['paramsType'][0],
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    this.commands.push({method, params});
    if (this.onSend) {
      return (await this.onSend(
        method,
        params,
      )) as ProtocolMapping.Commands[T]['returnType'];
    }
    return {} as ProtocolMapping.Commands[T]['returnType'];
  }

  override async detach(): Promise<void> {}
}

const logger = () => {
  return undefined;
};

describe('Tracing', () => {
  it('does not mutate caller categories when screenshots is enabled', async () => {
    const client = new MockCDPSession();
    const tracing = new Tracing(client, logger);
    const categories = Object.freeze(['-*', 'devtools.timeline']) as string[];

    await tracing.start({categories, screenshots: true});

    expect(categories).toEqual(['-*', 'devtools.timeline']);
    expect(client.commands).toEqual([
      {
        method: 'Tracing.start',
        params: {
          transferMode: 'ReturnAsStream',
          traceConfig: {
            excludedCategories: ['*'],
            includedCategories: [
              'devtools.timeline',
              'disabled-by-default-devtools.screenshot',
            ],
            traceBufferSizeInKb: undefined,
          },
        },
      },
    ]);
  });

  it('resets recording state when Tracing.start fails', async () => {
    const client = new MockCDPSession();
    let shouldFail = true;
    client.onSend = async method => {
      if (method === 'Tracing.start' && shouldFail) {
        throw new Error('Tracing is already started');
      }
      return {};
    };
    const tracing = new Tracing(client, logger);

    await expect(tracing.start()).rejects.toThrow('Tracing is already started');

    shouldFail = false;
    await tracing.start();
    expect(client.commands.length).toBe(2);
  });

  it('cleans up listeners and resets recording state when Tracing.end fails', async () => {
    const client = new MockCDPSession();
    client.onSend = async method => {
      if (method === 'Tracing.end') {
        throw new Error('Protocol error (Tracing.end): Tracing is not started');
      }
      return {};
    };
    const tracing = new Tracing(client, logger);

    await tracing.start();
    await expect(tracing.stop()).rejects.toThrow(
      'Protocol error (Tracing.end): Tracing is not started',
    );
    expect(client.listenerCount('Tracing.tracingComplete')).toBe(0);
    expect(client.listenerCount(CDPSessionEvent.Disconnected)).toBe(0);

    await tracing.start();
  });

  it('rejects and cleans up listeners if session disconnects while stopping', async () => {
    const client = new MockCDPSession();
    const tracing = new Tracing(client, logger);

    await tracing.start();
    const stopPromise = tracing.stop();
    await new Promise(resolve => {
      return setTimeout(resolve, 10);
    });
    client.emit(CDPSessionEvent.Disconnected, undefined);

    const timeout = Deferred.create<undefined>({
      timeout: 100,
      message: 'stop() hung on session disconnect',
    });
    await expect(Deferred.race([stopPromise, timeout])).rejects.toBeInstanceOf(
      TargetCloseError,
    );
    expect(client.listenerCount('Tracing.tracingComplete')).toBe(0);
    expect(client.listenerCount(CDPSessionEvent.Disconnected)).toBe(0);

    tracing.updateClient(new MockCDPSession());
    await tracing.start();
  });
});
