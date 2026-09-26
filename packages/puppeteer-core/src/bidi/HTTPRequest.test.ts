/**
 * @license
 * Copyright 2026 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {ProtocolError, TargetCloseError} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';

import type {Request} from './core/Request.js';
import type {BidiFrame} from './Frame.js';
import {BidiHTTPRequest} from './HTTPRequest.js';

class FakeRequest extends EventEmitter<{authenticate: void}> {
  readonly id = 'requestId';
  readonly isBlocked = true;
  continueWithAuthError: unknown;
  onContinueWithAuth: (() => void) | undefined;
  calls: Array<Record<string, unknown>> = [];

  async continueWithAuth(parameters: Record<string, unknown>): Promise<void> {
    this.calls.push(parameters);
    const hook = this.onContinueWithAuth;
    this.onContinueWithAuth = undefined;
    hook?.();
    if (this.continueWithAuthError !== undefined) {
      throw this.continueWithAuthError;
    }
  }
}

function createRequest(
  credentials:
    | {username: string; password: string}
    | null
    | (() => {username: string; password: string} | null),
  logger: Logger = () => {
    return undefined;
  },
) {
  const fakeRequest = new FakeRequest();
  const frame = {
    page() {
      return {
        _credentials:
          typeof credentials === 'function' ? credentials() : credentials,
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

async function settleEventLoop(): Promise<void> {
  // Lets promise reactions run and Node report any unhandled rejection before
  // the test inspects what happened.
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
    await settleEventLoop();
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

    const rejections = await collectRejections(() => {
      fakeRequest.emit('authenticate', undefined);
    });

    expect(fakeRequest.calls).toHaveLength(1);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(rejections).toHaveLength(0);
  });

  it('should not reject when continueWithAuth fails while canceling', async () => {
    const fakeRequest = createRequest(null);
    fakeRequest.continueWithAuthError = new ProtocolError(
      'No such request with the given id',
    );

    const rejections = await collectRejections(() => {
      fakeRequest.emit('authenticate', undefined);
    });

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
    await settleEventLoop();

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
    await settleEventLoop();

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

  it('should provide credentials only once and cancel afterwards', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});

    fakeRequest.emit('authenticate', undefined);
    await settleEventLoop();
    fakeRequest.emit('authenticate', undefined);
    await settleEventLoop();

    expect(fakeRequest.calls).toHaveLength(2);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(fakeRequest.calls[1]!['action']).toBe('cancel');
  });

  it('should cancel the second challenge emitted before the first one settles', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});

    fakeRequest.emit('authenticate', undefined);
    fakeRequest.emit('authenticate', undefined);
    await settleEventLoop();

    expect(fakeRequest.calls).toHaveLength(2);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(fakeRequest.calls[1]!['action']).toBe('cancel');
  });

  // The handled flag is set before `continueWithAuth` is called, so a
  // challenge emitted from inside that call cannot provide credentials again.
  it('should cancel a challenge emitted while credentials are being provided', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});
    fakeRequest.onContinueWithAuth = () => {
      fakeRequest.emit('authenticate', undefined);
    };

    fakeRequest.emit('authenticate', undefined);
    await settleEventLoop();

    expect(fakeRequest.calls).toHaveLength(2);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(fakeRequest.calls[1]!['action']).toBe('cancel');
  });

  // Empty strings are falsy but valid credentials and must not be turned into
  // a cancel.
  it('should provide empty credentials as-is', async () => {
    const fakeRequest = createRequest({username: '', password: ''});

    fakeRequest.emit('authenticate', undefined);
    await settleEventLoop();

    expect(fakeRequest.calls).toHaveLength(1);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(fakeRequest.calls[0]!['credentials']).toEqual({
      type: 'password',
      username: '',
      password: '',
    });
  });

  it('should not reject when canceling fails with a non-Error value', async () => {
    const fakeRequest = createRequest(null);
    fakeRequest.continueWithAuthError = 'No such request with the given id';

    const rejections = await collectRejections(() => {
      fakeRequest.emit('authenticate', undefined);
    });

    expect(fakeRequest.calls).toHaveLength(1);
    expect(fakeRequest.calls[0]!['action']).toBe('cancel');
    expect(rejections).toHaveLength(0);
  });

  it('should not reject when the page closes while the challenge is outstanding', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});
    fakeRequest.continueWithAuthError = new TargetCloseError('Target closed');

    const rejections = await collectRejections(() => {
      fakeRequest.emit('authenticate', undefined);
    });

    expect(fakeRequest.calls).toHaveLength(1);
    expect(rejections).toHaveLength(0);
  });

  it('should not reject when both arms fail in turn', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});
    fakeRequest.continueWithAuthError = new ProtocolError(
      'No such request with the given id',
    );

    const rejections = await collectRejections(() => {
      fakeRequest.emit('authenticate', undefined);
    });
    const moreRejections = await collectRejections(() => {
      fakeRequest.emit('authenticate', undefined);
    });

    expect(fakeRequest.calls).toHaveLength(2);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(fakeRequest.calls[1]!['action']).toBe('cancel');
    expect(rejections).toHaveLength(0);
    expect(moreRejections).toHaveLength(0);
  });

  // Credentials set only after a first challenge was canceled are provided on
  // the next challenge.
  it('should provide credentials set after an earlier challenge was canceled', async () => {
    let credentials: {username: string; password: string} | null = null;
    const fakeRequest = createRequest(() => {
      return credentials;
    });

    fakeRequest.emit('authenticate', undefined);
    await settleEventLoop();
    credentials = {username: 'user', password: 'pass'};
    fakeRequest.emit('authenticate', undefined);
    await settleEventLoop();

    expect(fakeRequest.calls).toHaveLength(2);
    expect(fakeRequest.calls[0]!['action']).toBe('cancel');
    expect(fakeRequest.calls[1]!['action']).toBe('provideCredentials');
  });
});
