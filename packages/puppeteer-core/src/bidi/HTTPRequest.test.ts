/**
 * @license
 * Copyright 2026 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {ProtocolError} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';

import type {Request} from './core/Request.js';
import type {BidiFrame} from './Frame.js';
import {BidiHTTPRequest} from './HTTPRequest.js';

class FakeRequest extends EventEmitter<{authenticate: void}> {
  readonly id = 'requestId';
  readonly isBlocked = true;
  continueWithAuthError: unknown;
  calls: Array<Record<string, unknown>> = [];

  async continueWithAuth(parameters: Record<string, unknown>): Promise<void> {
    this.calls.push(parameters);
    if (this.continueWithAuthError !== undefined) {
      throw this.continueWithAuthError;
    }
  }
}

function createRequest(
  credentials: {username: string; password: string} | null,
  logger: Logger = () => {
    return undefined;
  },
) {
  const fakeRequest = new FakeRequest();
  const frame = {
    page() {
      return {
        _credentials: credentials,
        trustedEmitter: {
          emit() {},
        },
      };
    },
  } as unknown as BidiFrame;

  BidiHTTPRequest.from(
    fakeRequest as unknown as Request,
    frame,
    false,
    undefined,
    logger,
  );

  return fakeRequest;
}

async function drainMicrotasks(): Promise<void> {
  // Two turns: one for the handler's promise, one for the unhandled rejection
  // check that Node performs after the microtask queue is empty.
  await new Promise(resolve => {
    return setImmediate(resolve);
  });
  await new Promise(resolve => {
    return setImmediate(resolve);
  });
}

async function collectRejections(action: () => void): Promise<unknown[]> {
  const rejections: unknown[] = [];
  const onUnhandledRejection = (reason: unknown) => {
    rejections.push(reason);
  };
  process.on('unhandledRejection', onUnhandledRejection);
  try {
    action();
    await drainMicrotasks();
  } finally {
    process.off('unhandledRejection', onUnhandledRejection);
  }
  return rejections;
}

/**
 * `network.continueWithAuth` can reject when the request was already canceled
 * or the page closed while the auth challenge was outstanding. The rejection
 * must be handled, otherwise it escapes as an unhandled rejection and crashes
 * the embedding process.
 */
describe('BidiHTTPRequest', () => {
  it('should not reject when continueWithAuth fails while providing credentials', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});
    fakeRequest.continueWithAuthError = new ProtocolError(
      'No such request with the given id',
    );

    const rejections: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandledRejection);
    try {
      fakeRequest.emit('authenticate', undefined);
      await drainMicrotasks();
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
    }

    expect(fakeRequest.calls).toHaveLength(1);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(rejections).toHaveLength(0);
  });

  it('should not reject when continueWithAuth fails while canceling', async () => {
    const fakeRequest = createRequest(null);
    fakeRequest.continueWithAuthError = new ProtocolError(
      'No such request with the given id',
    );

    const rejections: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandledRejection);
    try {
      fakeRequest.emit('authenticate', undefined);
      await drainMicrotasks();
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
    }

    expect(fakeRequest.calls).toHaveLength(1);
    expect(fakeRequest.calls[0]!['action']).toBe('cancel');
    expect(rejections).toHaveLength(0);
  });

  it('should log the error when continueWithAuth fails', async () => {
    const logged: Array<[string, unknown[]]> = [];
    const fakeRequest = createRequest(
      {username: 'user', password: 'pass'},
      prefix => {
        return (...args: unknown[]) => {
          logged.push([prefix, args]);
        };
      },
    );
    const error = new ProtocolError('No such request with the given id');
    fakeRequest.continueWithAuthError = error;

    fakeRequest.emit('authenticate', undefined);
    await drainMicrotasks();

    expect(logged).toHaveLength(1);
    expect(logged[0]![0]).toBe(DEBUG_PREFIXES.error);
    expect(logged[0]![1]).toEqual([error]);
  });

  it('should log the error when canceling the authentication fails', async () => {
    const logged: Array<[string, unknown[]]> = [];
    const fakeRequest = createRequest(null, prefix => {
      return (...args: unknown[]) => {
        logged.push([prefix, args]);
      };
    });
    const error = new ProtocolError('No such request with the given id');
    fakeRequest.continueWithAuthError = error;

    fakeRequest.emit('authenticate', undefined);
    await drainMicrotasks();

    expect(fakeRequest.calls).toHaveLength(1);
    expect(fakeRequest.calls[0]!['action']).toBe('cancel');
    expect(logged).toHaveLength(1);
    expect(logged[0]![0]).toBe(DEBUG_PREFIXES.error);
    expect(logged[0]![1]).toEqual([error]);
  });

  it('should not reject when continueWithAuth fails with a non-Error value', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});
    fakeRequest.continueWithAuthError = 'No such request with the given id';

    const rejections = await collectRejections(() => {
      fakeRequest.emit('authenticate', undefined);
    });

    expect(fakeRequest.calls).toHaveLength(1);
    expect(rejections).toHaveLength(0);
  });

  it('should not reject when continueWithAuth fails and logging is unavailable', async () => {
    const fakeRequest = createRequest(
      {username: 'user', password: 'pass'},
      undefined as unknown as Logger,
    );
    fakeRequest.continueWithAuthError = new ProtocolError(
      'No such request with the given id',
    );

    const rejections = await collectRejections(() => {
      fakeRequest.emit('authenticate', undefined);
    });

    expect(fakeRequest.calls).toHaveLength(1);
    expect(rejections).toHaveLength(0);
  });

  // Control: passes with and without the fix. Pins that answering the
  // challenge still happens exactly once when nothing rejects.
  it('should provide credentials only once and cancel afterwards', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});

    fakeRequest.emit('authenticate', undefined);
    await drainMicrotasks();
    fakeRequest.emit('authenticate', undefined);
    await drainMicrotasks();

    expect(fakeRequest.calls).toHaveLength(2);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(fakeRequest.calls[1]!['action']).toBe('cancel');
  });

  // Control: passes with and without the fix. The fix awaits
  // `continueWithAuth`, so this pins that the handled flag is still set before
  // the call and a re-entrant challenge cannot provide credentials twice.
  it('should cancel the second challenge emitted before the first one settles', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});

    fakeRequest.emit('authenticate', undefined);
    fakeRequest.emit('authenticate', undefined);
    await drainMicrotasks();

    expect(fakeRequest.calls).toHaveLength(2);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(fakeRequest.calls[1]!['action']).toBe('cancel');
  });

  // Control: passes with and without the fix. Empty strings are falsy but
  // valid credentials and must not be turned into a cancel.
  it('should provide empty credentials as-is', async () => {
    const fakeRequest = createRequest({username: '', password: ''});

    fakeRequest.emit('authenticate', undefined);
    await drainMicrotasks();

    expect(fakeRequest.calls).toHaveLength(1);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(fakeRequest.calls[0]!['credentials']).toEqual({
      type: 'password',
      username: '',
      password: '',
    });
  });
});
