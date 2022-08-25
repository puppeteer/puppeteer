/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Protocol} from 'devtools-protocol';
import type {Readable} from 'stream';
import {isNode} from '../environment.js';
import {assert} from '../util/assert.js';
import {isErrorLike} from '../util/ErrorLike.js';
import {CDPSession} from './Connection.js';
import {debug} from './Debug.js';
import {ElementHandle} from './ElementHandle.js';
import {TimeoutError} from './Errors.js';
import {CommonEventEmitter} from './EventEmitter.js';
import {ExecutionContext} from './ExecutionContext.js';
import {JSHandle} from './JSHandle.js';

/**
 * @internal
 */
export const debugError = debug('puppeteer:error');

/**
 * @internal
 */
export function getExceptionMessage(
  exceptionDetails: Protocol.Runtime.ExceptionDetails
): string {
  if (exceptionDetails.exception) {
    return (
      exceptionDetails.exception.description || exceptionDetails.exception.value
    );
  }
  let message = exceptionDetails.text;
  if (exceptionDetails.stackTrace) {
    for (const callframe of exceptionDetails.stackTrace.callFrames) {
      const location =
        callframe.url +
        ':' +
        callframe.lineNumber +
        ':' +
        callframe.columnNumber;
      const functionName = callframe.functionName || '<anonymous>';
      message += `\n    at ${functionName} (${location})`;
    }
  }
  return message;
}

/**
 * @internal
 */
export function valueFromRemoteObject(
  remoteObject: Protocol.Runtime.RemoteObject
): any {
  assert(!remoteObject.objectId, 'Cannot extract value when objectId is given');
  if (remoteObject.unserializableValue) {
    if (remoteObject.type === 'bigint' && typeof BigInt !== 'undefined') {
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
export async function releaseObject(
  client: CDPSession,
  remoteObject: Protocol.Runtime.RemoteObject
): Promise<void> {
  if (!remoteObject.objectId) {
    return;
  }
  await client
    .send('Runtime.releaseObject', {objectId: remoteObject.objectId})
    .catch(error => {
      // Exceptions might happen in case of a page been navigated or closed.
      // Swallow these since they are harmless and we don't leak anything in this case.
      debugError(error);
    });
}

/**
 * @internal
 */
export interface PuppeteerEventListener {
  emitter: CommonEventEmitter;
  eventName: string | symbol;
  handler: (...args: any[]) => void;
}

/**
 * @internal
 */
export function addEventListener(
  emitter: CommonEventEmitter,
  eventName: string | symbol,
  handler: (...args: any[]) => void
): PuppeteerEventListener {
  emitter.on(eventName, handler);
  return {emitter, eventName, handler};
}

/**
 * @internal
 */
export function removeEventListeners(
  listeners: Array<{
    emitter: CommonEventEmitter;
    eventName: string | symbol;
    handler: (...args: any[]) => void;
  }>
): void {
  for (const listener of listeners) {
    listener.emitter.removeListener(listener.eventName, listener.handler);
  }
  listeners.length = 0;
}

/**
 * @internal
 */
export const isString = (obj: unknown): obj is string => {
  return typeof obj === 'string' || obj instanceof String;
};

/**
 * @internal
 */
export const isNumber = (obj: unknown): obj is number => {
  return typeof obj === 'number' || obj instanceof Number;
};

/**
 * @internal
 */
export async function waitForEvent<T>(
  emitter: CommonEventEmitter,
  eventName: string | symbol,
  predicate: (event: T) => Promise<boolean> | boolean,
  timeout: number,
  abortPromise: Promise<Error>
): Promise<T> {
  let eventTimeout: NodeJS.Timeout;
  let resolveCallback: (value: T | PromiseLike<T>) => void;
  let rejectCallback: (value: Error) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveCallback = resolve;
    rejectCallback = reject;
  });
  const listener = addEventListener(emitter, eventName, async event => {
    if (!(await predicate(event))) {
      return;
    }
    resolveCallback(event);
  });
  if (timeout) {
    eventTimeout = setTimeout(() => {
      rejectCallback(
        new TimeoutError('Timeout exceeded while waiting for event')
      );
    }, timeout);
  }
  function cleanup(): void {
    removeEventListeners([listener]);
    clearTimeout(eventTimeout);
  }
  const result = await Promise.race([promise, abortPromise]).then(
    r => {
      cleanup();
      return r;
    },
    error => {
      cleanup();
      throw error;
    }
  );
  if (isErrorLike(result)) {
    throw result;
  }

  return result;
}

/**
 * @internal
 */
export function createJSHandle(
  context: ExecutionContext,
  remoteObject: Protocol.Runtime.RemoteObject
): JSHandle | ElementHandle<Node> {
  if (remoteObject.subtype === 'node' && context._world) {
    return new ElementHandle(context, remoteObject, context._world.frame());
  }
  return new JSHandle(context, remoteObject);
}

/**
 * @internal
 */
export function evaluationString(
  fun: Function | string,
  ...args: unknown[]
): string {
  if (isString(fun)) {
    assert(args.length === 0, 'Cannot evaluate a string with arguments');
    return fun;
  }

  function serializeArgument(arg: unknown): string {
    if (Object.is(arg, undefined)) {
      return 'undefined';
    }
    return JSON.stringify(arg);
  }

  return `(${fun})(${args.map(serializeArgument).join(',')})`;
}

/**
 * @internal
 */
export function pageBindingInitString(type: string, name: string): string {
  function addPageBinding(type: string, bindingName: string): void {
    /* Cast window to any here as we're about to add properties to it
     * via win[bindingName] which TypeScript doesn't like.
     */
    const win = window as any;
    const binding = win[bindingName];

    win[bindingName] = (...args: unknown[]): Promise<unknown> => {
      const me = (window as any)[bindingName];
      let callbacks = me.callbacks;
      if (!callbacks) {
        callbacks = new Map();
        me.callbacks = callbacks;
      }
      const seq = (me.lastSeq || 0) + 1;
      me.lastSeq = seq;
      const promise = new Promise((resolve, reject) => {
        return callbacks.set(seq, {resolve, reject});
      });
      binding(JSON.stringify({type, name: bindingName, seq, args}));
      return promise;
    };
  }
  return evaluationString(addPageBinding, type, name);
}

/**
 * @internal
 */
export function pageBindingDeliverResultString(
  name: string,
  seq: number,
  result: unknown
): string {
  function deliverResult(name: string, seq: number, result: unknown): void {
    (window as any)[name].callbacks.get(seq).resolve(result);
    (window as any)[name].callbacks.delete(seq);
  }
  return evaluationString(deliverResult, name, seq, result);
}

/**
 * @internal
 */
export function pageBindingDeliverErrorString(
  name: string,
  seq: number,
  message: string,
  stack?: string
): string {
  function deliverError(
    name: string,
    seq: number,
    message: string,
    stack?: string
  ): void {
    const error = new Error(message);
    error.stack = stack;
    (window as any)[name].callbacks.get(seq).reject(error);
    (window as any)[name].callbacks.delete(seq);
  }
  return evaluationString(deliverError, name, seq, message, stack);
}

/**
 * @internal
 */
export function pageBindingDeliverErrorValueString(
  name: string,
  seq: number,
  value: unknown
): string {
  function deliverErrorValue(name: string, seq: number, value: unknown): void {
    (window as any)[name].callbacks.get(seq).reject(value);
    (window as any)[name].callbacks.delete(seq);
  }
  return evaluationString(deliverErrorValue, name, seq, value);
}

/**
 * @internal
 */
export function makePredicateString(
  predicate: Function,
  predicateQueryHandler: Function
): string {
  function checkWaitForOptions(
    node: Node | null,
    waitForVisible: boolean,
    waitForHidden: boolean
  ): Node | null | boolean {
    if (!node) {
      return waitForHidden;
    }
    if (!waitForVisible && !waitForHidden) {
      return node;
    }
    const element =
      node.nodeType === Node.TEXT_NODE
        ? (node.parentElement as Element)
        : (node as Element);

    const style = window.getComputedStyle(element);
    const isVisible =
      style && style.visibility !== 'hidden' && hasVisibleBoundingBox();
    const success =
      waitForVisible === isVisible || waitForHidden === !isVisible;
    return success ? node : null;

    function hasVisibleBoundingBox(): boolean {
      const rect = element.getBoundingClientRect();
      return !!(rect.top || rect.bottom || rect.width || rect.height);
    }
  }

  return `
    (() => {
      const predicateQueryHandler = ${predicateQueryHandler};
      const checkWaitForOptions = ${checkWaitForOptions};
      return (${predicate})(...args)
    })() `;
}

/**
 * @internal
 */
export async function waitWithTimeout<T>(
  promise: Promise<T>,
  taskName: string,
  timeout: number
): Promise<T> {
  let reject: (reason?: Error) => void;
  const timeoutError = new TimeoutError(
    `waiting for ${taskName} failed: timeout ${timeout}ms exceeded`
  );
  const timeoutPromise = new Promise<T>((_res, rej) => {
    return (reject = rej);
  });
  let timeoutTimer = null;
  if (timeout) {
    timeoutTimer = setTimeout(() => {
      return reject(timeoutError);
    }, timeout);
  }
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
  }
}

/**
 * @internal
 */
let fs: typeof import('fs') | null = null;
/**
 * @internal
 */
export async function importFS(): Promise<typeof import('fs')> {
  if (!fs) {
    fs = await import('fs');
  }
  return fs;
}

/**
 * @internal
 */
export async function getReadableAsBuffer(
  readable: Readable,
  path?: string
): Promise<Buffer | null> {
  const buffers = [];
  if (path) {
    let fs: typeof import('fs').promises;
    try {
      fs = (await importFS()).promises;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          'Cannot write to a path outside of a Node-like environment.'
        );
      }
      throw error;
    }
    const fileHandle = await fs.open(path, 'w+');
    for await (const chunk of readable) {
      buffers.push(chunk);
      await fileHandle.writeFile(chunk);
    }
    await fileHandle.close();
  } else {
    for await (const chunk of readable) {
      buffers.push(chunk);
    }
  }
  try {
    return Buffer.concat(buffers);
  } catch (error) {
    return null;
  }
}

/**
 * @internal
 */
export async function getReadableFromProtocolStream(
  client: CDPSession,
  handle: string
): Promise<Readable> {
  // TODO: Once Node 18 becomes the lowest supported version, we can migrate to
  // ReadableStream.
  if (!isNode) {
    throw new Error('Cannot create a stream outside of Node.js environment.');
  }

  const {Readable} = await import('stream');

  let eof = false;
  return new Readable({
    async read(size: number) {
      if (eof) {
        return;
      }

      const response = await client.send('IO.read', {handle, size});
      this.push(response.data, response.base64Encoded ? 'base64' : undefined);
      if (response.eof) {
        eof = true;
        await client.send('IO.close', {handle});
        this.push(null);
      }
    },
  });
}
