/**
 * @license
 * Copyright 2026 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {ProtocolError} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';

import type {Request} from './core/Request.js';
import {BidiHTTPRequest} from './HTTPRequest.js';
import type {BidiFrame} from './Frame.js';

class FakeRequest extends EventEmitter<{authenticate: void}> {
  readonly id = 'requestId';
  readonly isBlocked = true;
  continueWithAuthError: Error | undefined;
  calls: Array<Record<string, unknown>> = [];

  async continueWithAuth(parameters: Record<string, unknown>): Promise<void> {
    this.calls.push(parameters);
    if (this.continueWithAuthError) {
      throw this.continueWithAuthError;
    }
  }
}

function createRequest(credentials: {username: string; password: string} | null) {
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
    () => {
      return undefined;
    },
  );

  return fakeRequest;
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
      // Allow the microtask queue and the unhandled rejection check to drain.
      await new Promise(resolve => {
        return setImmediate(resolve);
      });
      await new Promise(resolve => {
        return setImmediate(resolve);
      });
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
      await new Promise(resolve => {
        return setImmediate(resolve);
      });
      await new Promise(resolve => {
        return setImmediate(resolve);
      });
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
    }

    expect(fakeRequest.calls).toHaveLength(1);
    expect(fakeRequest.calls[0]!['action']).toBe('cancel');
    expect(rejections).toHaveLength(0);
  });

  it('should provide credentials only once and cancel afterwards', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});

    fakeRequest.emit('authenticate', undefined);
    await new Promise(resolve => {
      return setImmediate(resolve);
    });
    fakeRequest.emit('authenticate', undefined);
    await new Promise(resolve => {
      return setImmediate(resolve);
    });

    expect(fakeRequest.calls).toHaveLength(2);
    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(fakeRequest.calls[1]!['action']).toBe('cancel');
  });
});
