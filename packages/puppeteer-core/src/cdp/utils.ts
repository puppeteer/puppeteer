/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Protocol} from 'devtools-protocol';

import {PuppeteerURL, evaluationString} from '../common/util.js';
import {assert} from '../util/assert.js';

/**
 * @internal
 */
export function createEvaluationError(
  details: Protocol.Runtime.ExceptionDetails
): unknown {
  let name: string;
  let message: string;
  if (!details.exception) {
    name = 'Error';
    message = details.text;
  } else if (
    (details.exception.type !== 'object' ||
      details.exception.subtype !== 'error') &&
    !details.exception.objectId
  ) {
    return valueFromRemoteObject(details.exception);
  } else {
    const detail = getErrorDetails(details);
    name = detail.name;
    message = detail.message;
  }
  const messageHeight = message.split('\n').length;
  const error = new Error(message);
  error.name = name;
  const stackLines = error.stack!.split('\n');
  const messageLines = stackLines.splice(0, messageHeight);

  // The first line is this function which we ignore.
  stackLines.shift();
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

  error.stack = [...messageLines, ...stackLines].join('\n');
  return error;
}

const getErrorDetails = (details: Protocol.Runtime.ExceptionDetails) => {
  let name = '';
  let message: string;
  const lines = details.exception?.description?.split('\n    at ') ?? [];
  const size = Math.min(
    details.stackTrace?.callFrames.length ?? 0,
    lines.length - 1
  );
  lines.splice(-size, size);
  if (details.exception?.className) {
    name = details.exception.className;
  }
  message = lines.join('\n');
  if (name && message.startsWith(`${name}: `)) {
    message = message.slice(name.length + 2);
  }
  return {message, name};
};

/**
 * @internal
 */
export function createClientError(
  details: Protocol.Runtime.ExceptionDetails
): Error {
  let name: string;
  let message: string;
  if (!details.exception) {
    name = 'Error';
    message = details.text;
  } else if (
    (details.exception.type !== 'object' ||
      details.exception.subtype !== 'error') &&
    !details.exception.objectId
  ) {
    return valueFromRemoteObject(details.exception);
  } else {
    const detail = getErrorDetails(details);
    name = detail.name;
    message = detail.message;
  }
  const error = new Error(message);
  error.name = name;

  const messageHeight = error.message.split('\n').length;
  const messageLines = error.stack!.split('\n').splice(0, messageHeight);

  const stackLines = [];
  if (details.stackTrace) {
    for (const frame of details.stackTrace.callFrames) {
      // Note we need to add `1` because the values are 0-indexed.
      stackLines.push(
        `    at ${frame.functionName || '<anonymous>'} (${frame.url}:${
          frame.lineNumber + 1
        }:${frame.columnNumber + 1})`
      );
      if (stackLines.length >= Error.stackTraceLimit) {
        break;
      }
    }
  }

  error.stack = [...messageLines, ...stackLines].join('\n');
  return error;
}

/**
 * @internal
 */
export function valueFromRemoteObject(
  remoteObject: Protocol.Runtime.RemoteObject
): any {
  assert(!remoteObject.objectId, 'Cannot extract value when objectId is given');
  if (remoteObject.unserializableValue) {
    if (remoteObject.type === 'bigint') {
      return BigInt(remoteObject.unserializableValue.replace('n', ''));
    }
    switch (remoteObject.unserializableValue) {
      case '-0':
        return -0;
      case 'NaN':
        return NaN;
      case 'Infinity':
        return Infinity;
      case '-Infinity':
        return -Infinity;
      default:
        throw new Error(
          'Unsupported unserializable value: ' +
            remoteObject.unserializableValue
        );
    }
  }
  return remoteObject.value;
}

/**
 * @internal
 */
export function addPageBinding(type: string, name: string): void {
  // This is the CDP binding.
  // @ts-expect-error: In a different context.
  const callCdp = globalThis[name];

  // Depending on the frame loading state either Runtime.evaluate or
  // Page.addScriptToEvaluateOnNewDocument might succeed. Let's check that we
  // don't re-wrap Puppeteer's binding.
  if (callCdp[Symbol.toStringTag] === 'PuppeteerBinding') {
    return;
  }

  // We replace the CDP binding with a Puppeteer binding.
  Object.assign(globalThis, {
    [name](...args: unknown[]): Promise<unknown> {
      // This is the Puppeteer binding.
      // @ts-expect-error: In a different context.
      const callPuppeteer = globalThis[name];
      callPuppeteer.args ??= new Map();
      callPuppeteer.callbacks ??= new Map();

      const seq = (callPuppeteer.lastSeq ?? 0) + 1;
      callPuppeteer.lastSeq = seq;
      callPuppeteer.args.set(seq, args);

      callCdp(
        JSON.stringify({
          type,
          name,
          seq,
          args,
          isTrivial: !args.some(value => {
            return value instanceof Node;
          }),
        })
      );

      return new Promise((resolve, reject) => {
        callPuppeteer.callbacks.set(seq, {
          resolve(value: unknown) {
            callPuppeteer.args.delete(seq);
            resolve(value);
          },
          reject(value?: unknown) {
            callPuppeteer.args.delete(seq);
            reject(value);
          },
        });
      });
    },
  });
  // @ts-expect-error: In a different context.
  globalThis[name][Symbol.toStringTag] = 'PuppeteerBinding';
}

/**
 * @internal
 */
export function pageBindingInitString(type: string, name: string): string {
  return evaluationString(addPageBinding, type, name);
}
