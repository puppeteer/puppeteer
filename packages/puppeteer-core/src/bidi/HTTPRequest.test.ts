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
import type {BidiFrame} from './Frame.js';
import {BidiHTTPRequest} from './HTTPRequest.js';

class FakeRequest extends EventEmitter<{authenticate: void}> {
  readonly id = 'requestId';
  readonly isBlocked = true;
  calls: Array<Record<string, unknown>> = [];

  async continueWithAuth(parameters: Record<string, unknown>): Promise<void> {
    this.calls.push(parameters);
    throw new ProtocolError('No such request with the given id');
  }
}

function createRequest(
  credentials: {username: string; password: string} | null,
): FakeRequest {
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

async function unhandledRejectionsOnAuthenticate(
  fakeRequest: FakeRequest,
): Promise<unknown[]> {
  const rejections: unknown[] = [];
  const onUnhandledRejection = (reason: unknown) => {
    rejections.push(reason);
  };
  process.on('unhandledRejection', onUnhandledRejection);
  try {
    fakeRequest.emit('authenticate', undefined);
    // Node reports an unhandled rejection once the promise reactions have run.
    await new Promise(resolve => {
      return setImmediate(resolve);
    });
    await new Promise(resolve => {
      return setImmediate(resolve);
    });
  } finally {
    process.off('unhandledRejection', onUnhandledRejection);
  }
  return rejections;
}

describe('BidiHTTPRequest', () => {
  it('should not reject when continueWithAuth fails while providing credentials', async () => {
    const fakeRequest = createRequest({username: 'user', password: 'pass'});

    const rejections = await unhandledRejectionsOnAuthenticate(fakeRequest);

    expect(fakeRequest.calls[0]!['action']).toBe('provideCredentials');
    expect(rejections).toHaveLength(0);
  });

  it('should not reject when continueWithAuth fails while canceling', async () => {
    const fakeRequest = createRequest(null);

    const rejections = await unhandledRejectionsOnAuthenticate(fakeRequest);

    expect(fakeRequest.calls[0]!['action']).toBe('cancel');
    expect(rejections).toHaveLength(0);
  });
});
