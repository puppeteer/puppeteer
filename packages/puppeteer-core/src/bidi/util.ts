/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'webdriver-bidi-protocol';

import type {Frame} from '../api/Frame.js';
import type {WebWorker} from '../api/WebWorker.js';
import {ConsoleMessage} from '../common/ConsoleMessage.js';
import type {
  ConsoleMessageLocation,
  ConsoleMessageType,
} from '../common/ConsoleMessage.js';
import {ProtocolError, TimeoutError} from '../common/Errors.js';
import {RemoteException} from '../common/RemoteException.js';
import {PuppeteerURL} from '../common/util.js';

import type {BidiElementHandle} from './bidi.js';
import {BidiDeserializer} from './Deserializer.js';
import {BidiJSHandle} from './JSHandle.js';

/**
 * @internal
 *
 * TODO: Remove this and map CDP the correct method.
 * Requires breaking change.
 */
export function convertConsoleMessageLevel(method: string): ConsoleMessageType {
  switch (method) {
    case 'group':
      return 'startGroup';
    case 'groupCollapsed':
      return 'startGroupCollapsed';
    case 'groupEnd':
      return 'endGroup';
    default:
      return method as ConsoleMessageType;
  }
}

/**
 * @internal
 */
export function getStackTraceLocations(
  stackTrace?: Bidi.Script.StackTrace,
): ConsoleMessageLocation[] {
  const stackTraceLocations: ConsoleMessageLocation[] = [];
  if (stackTrace) {
    for (const callFrame of stackTrace.callFrames) {
      stackTraceLocations.push({
        url: callFrame.url,
        lineNumber: callFrame.lineNumber,
        columnNumber: callFrame.columnNumber,
      });
    }
  }
  return stackTraceLocations;
}

/**
 * @internal
 */
export function getConsoleMessage(
  entry: Bidi.Log.ConsoleLogEntry,
  args: Array<BidiJSHandle<unknown> | BidiElementHandle<Node>>,
  frame?: Frame,
  targetId?: string,
  worker?: WebWorker,
): ConsoleMessage {
  const text = args
    .reduce((value, arg) => {
      const parsedValue =
        arg instanceof BidiJSHandle && arg.isPrimitiveValue
          ? BidiDeserializer.deserialize(arg.remoteValue())
          : arg.toString();
      return `${value} ${parsedValue}`;
    }, '')
    .slice(1);

  return new ConsoleMessage(
    convertConsoleMessageLevel(entry.method),
    text,
    args,
    getStackTraceLocations(entry.stackTrace),
    frame,
    undefined,
    targetId,
    worker,
  );
}

/**
 * @internal
 */
export function isConsoleLogEntry(
  event: Bidi.Log.Entry,
): event is Bidi.Log.ConsoleLogEntry {
  return event.type === 'console';
}

/**
 * @internal
 */
export function isJavaScriptLogEntry(
  event: Bidi.Log.Entry,
): event is Bidi.Log.JavascriptLogEntry {
  return event.type === 'javascript';
}

/**
 * Creates the `Error` dispatched by the deprecated `pageerror` event from a
 * WebDriver BiDi JavaScript log entry.
 *
 * @internal
 */
export function createPageErrorFromLogEntry(
  entry: Bidi.Log.JavascriptLogEntry,
): Error {
  const error = new Error(entry.text ?? '');

  const messageHeight = error.message.split('\n').length;
  const messageLines = error.stack!.split('\n').splice(0, messageHeight);

  const stackLines = [];
  if (entry.stackTrace) {
    for (const frame of entry.stackTrace.callFrames) {
      // Note we need to add `1` because the values are 0-indexed.
      stackLines.push(
        `    at ${frame.functionName || '<anonymous>'} (${frame.url}:${
          frame.lineNumber + 1
        }:${frame.columnNumber + 1})`,
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
 * Creates a {@link RemoteException} from a WebDriver BiDi JavaScript log entry.
 *
 * @remarks
 * WebDriver BiDi does not expose the exception name nor a remote reference to
 * the thrown value, so `name()` is `null` and `handle()` is `undefined`.
 *
 * @internal
 */
export function createRemoteExceptionFromLogEntry(
  entry: Bidi.Log.JavascriptLogEntry,
): RemoteException {
  return new RemoteException({
    text: entry.text ?? '',
    name: null,
    stackTrace: (entry.stackTrace?.callFrames ?? []).map(frame => {
      return {
        url: frame.url,
        lineNumber: frame.lineNumber,
        columnNumber: frame.columnNumber,
        functionName: frame.functionName,
      };
    }),
  });
}

/**
 * @internal
 */
export function createEvaluationError(
  details: Bidi.Script.ExceptionDetails,
): unknown {
  if (details.exception.type === 'object' && !('value' in details.exception)) {
    // Heuristic detecting a platform object was thrown. WebDriver BiDi serializes
    // platform objects without value. If so, throw a generic error with the actual
    // exception's message, as there is no way to restore the original exception's
    // constructor.
    return new Error(details.text);
  }

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
          })`,
        );
      } else {
        stackLines.push(
          `    at ${frame.functionName || '<anonymous>'} (${frame.url}:${
            frame.lineNumber
          }:${frame.columnNumber})`,
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

/**
 * @internal
 */
export function rewriteNavigationError(
  message: string,
  ms: number,
): (error: unknown) => never {
  return error => {
    if (error instanceof ProtocolError) {
      error.message += ` at ${message}`;
    } else if (error instanceof TimeoutError) {
      error.message = `Navigation timeout of ${ms} ms exceeded`;
    }
    throw error;
  };
}

/**
 * @internal
 */
export function rewriteEvaluationError(error: unknown): never {
  if (error instanceof Error) {
    if (
      error.message.includes('ExecutionContext was destroyed') ||
      error.message.includes('Inspected target navigated or closed')
    ) {
      throw new Error(
        'Execution context was destroyed, most likely because of a navigation.',
      );
    }
  }
  throw error;
}
