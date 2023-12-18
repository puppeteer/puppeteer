/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {PuppeteerURL, debugError} from '../common/util.js';

import {BidiDeserializer} from './Deserializer.js';
import type {BidiRealm} from './Realm.js';

/**
 * @internal
 */
export async function releaseReference(
  client: BidiRealm,
  remoteReference: Bidi.Script.RemoteReference
): Promise<void> {
  if (!remoteReference.handle) {
    return;
  }
  await client.connection
    .send('script.disown', {
      target: client.target,
      handles: [remoteReference.handle],
    })
    .catch((error: any) => {
      // Exceptions might happen in case of a page been navigated or closed.
      // Swallow these since they are harmless and we don't leak anything in this case.
      debugError(error);
    });
}

/**
 * @internal
 */
export function createEvaluationError(
  details: Bidi.Script.ExceptionDetails
): unknown {
  if (details.exception.type !== 'error') {
    return BidiDeserializer.deserialize(details.exception);
  }
  const [name = '', ...parts] = details.text.split(': ');
  const message = parts.join(': ');
  const error = new Error(message);
  error.name = name;

  // The first line is this function which we ignore.
  const stackLines = [];
  if (details.stackTrace && stackLines.length < Error.stackTraceLimit) {
    for (const frame of details.stackTrace.callFrames.reverse()) {
      if (
        PuppeteerURL.isPuppeteerURL(frame.url) &&
        frame.url !== PuppeteerURL.INTERNAL_URL
      ) {
        const url = PuppeteerURL.parse(frame.url);
        stackLines.unshift(
          `    at ${frame.functionName || url.functionName} (${
            url.functionName
          } at ${url.siteString}, <anonymous>:${frame.lineNumber}:${
            frame.columnNumber
          })`
        );
      } else {
        stackLines.push(
          `    at ${frame.functionName || '<anonymous>'} (${frame.url}:${
            frame.lineNumber
          }:${frame.columnNumber})`
        );
      }
      if (stackLines.length >= Error.stackTraceLimit) {
        break;
      }
    }
  }

  error.stack = [details.text, ...stackLines].join('\n');
  return error;
}
