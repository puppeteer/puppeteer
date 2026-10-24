/**
 * @license
 * Copyright 2026 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';
import type * as Bidi from 'webdriver-bidi-protocol';

import {ProtocolError} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';

import type {Request} from './core/Request.js';
import type {BidiFrame} from './Frame.js';
import {BidiHTTPRequest} from './HTTPRequest.js';

class FakeRequest extends EventEmitter<{authenticate: void}> {
  readonly id = 'requestId';
  readonly isBlocked = true;
  calls: Array<Record<string, unknown>> = [];
  responses: Array<Omit<Bidi.Network.ProvideResponseParameters, 'request'>> =
    [];

  async continueWithAuth(parameters: Record<string, unknown>): Promise<void> {
    this.calls.push(parameters);
    throw new ProtocolError('No such request with the given id');
  }

  async provideResponse(
    parameters: Omit<Bidi.Network.ProvideResponseParameters, 'request'>,
  ): Promise<void> {
    this.responses.push(parameters);
  }
}

function createRequest(
  credentials: {username: string; password: string} | null,
): FakeRequest {
  return createBidiRequest(credentials).fakeRequest;
}

function createBidiRequest(
  credentials: {username: string; password: string} | null,
): {fakeRequest: FakeRequest; request: BidiHTTPRequest} {
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

  const request = BidiHTTPRequest.from(
    fakeRequest as unknown as Request,
    frame,
    false,
    undefined,
    () => {
      return undefined;
    },
  );

  return {fakeRequest, request};
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

  it('should let contentType replace a content-type header in respond()', async () => {
    const {fakeRequest, request} = createBidiRequest(null);

    await request._respond({
      status: 200,
      headers: {'Content-Type': 'text/html'},
      contentType: 'text/plain',
      body: 'ok',
    });

    expect(fakeRequest.responses).toHaveLength(1);
    expect(fakeRequest.responses[0]!.headers).toEqual([
      {name: 'content-type', value: {type: 'string', value: 'text/plain'}},
      {name: 'content-length', value: {type: 'string', value: '2'}},
    ]);
  });
});
