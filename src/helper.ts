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

import * as fs from 'fs';
import * as util from 'util';

import debug from 'debug';
import {TimeoutError} from './Errors';
import { AnyFunction, Debugger } from './types';
import { CDPSession } from './Connection';
import { Protocol } from './protocol';

export const debugError: Debugger = debug(`puppeteer:error`);
const openAsync = util.promisify(fs.open);
const writeAsync = util.promisify(fs.write);
const closeAsync = util.promisify(fs.close);

export function assert(value: unknown, message?: string): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

export {
  Helper as helper,
};

export class Helper {
  static evaluationString(fun: AnyFunction|string, ...args: any[]): string {
    if (Helper.isString(fun)) {
      assert(args.length === 0, 'Cannot evaluate a string with arguments');
      return /** @type {string} */ (fun);
    }
    return `(${fun})(${args.map(serializeArgument).join(',')})`;

    
    function serializeArgument(arg: any): string {
      if (Object.is(arg, undefined))
        return 'undefined';
      return JSON.stringify(arg);
    }
  }

  static getExceptionMessage(exceptionDetails: Protocol.Runtime.ExceptionDetails): string {
    if (exceptionDetails.exception)
      return exceptionDetails.exception.description || exceptionDetails.exception.value;
    let message = exceptionDetails.text;
    if (exceptionDetails.stackTrace) {
      for (const callframe of exceptionDetails.stackTrace.callFrames) {
        const location = callframe.url + ':' + callframe.lineNumber + ':' + callframe.columnNumber;
        const functionName = callframe.functionName || '<anonymous>';
        message += `\n    at ${functionName} (${location})`;
      }
    }
    return message;
  }

  static valueFromRemoteObject(remoteObject: Protocol.Runtime.RemoteObject): any {
    assert(!remoteObject.objectId, 'Cannot extract value when objectId is given');
    if (remoteObject.unserializableValue) {
      if (remoteObject.type === 'bigint' && typeof BigInt !== 'undefined')
        return BigInt(remoteObject.unserializableValue.replace('n', ''));
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
          throw new Error('Unsupported unserializable value: ' + remoteObject.unserializableValue);
      }
    }
    return remoteObject.value;
  }

  static async releaseObject(client: CDPSession, remoteObject: Protocol.Runtime.RemoteObject) {
    if (!remoteObject.objectId)
      return;
    await client.send('Runtime.releaseObject', {objectId: remoteObject.objectId}).catch(error => {
      // Exceptions might happen in case of a page been navigated or closed.
      // Swallow these since they are harmless and we don't leak anything in this case.
      debugError(error);
    });
  }

  static installAsyncStackHooks(classType: {new(): unknown}) {
    for (const methodName of Reflect.ownKeys(classType.prototype)) {
      const method = Reflect.get(classType.prototype, methodName);
      if (methodName === 'constructor' || typeof methodName !== 'string' || methodName.startsWith('_') || typeof method !== 'function' || method.constructor.name !== 'AsyncFunction')
        continue;
      Reflect.set(classType.prototype, methodName, function(this: any, ...args: any[]) {
        const syncStack = {} as {stack: string};
        Error.captureStackTrace(syncStack);
        return method.call(this, ...args).catch((e: Error) => {
          const stack = syncStack.stack.substring(syncStack.stack.indexOf('\n') + 1);
          const clientStack = stack.substring(stack.indexOf('\n'));
          if (e instanceof Error && e.stack && !e.stack.includes(clientStack))
            e.stack += '\n  -- ASYNC --\n' + stack;
          throw e;
        });
      });
    }
  }

  static addEventListener(emitter: NodeJS.EventEmitter, eventName: (string|symbol), handler: AnyFunction): {emitter: NodeJS.EventEmitter, eventName: (string|symbol), handler: AnyFunction} {
    emitter.on(eventName, handler);
    return { emitter, eventName, handler };
  }

  static removeEventListeners(listeners: Array<{emitter: NodeJS.EventEmitter, eventName: (string|symbol), handler: AnyFunction}>) {
    for (const listener of listeners)
      listener.emitter.removeListener(listener.eventName, listener.handler);
    listeners.length = 0;
  }

  static isString(value: unknown): value is string {
    return typeof value === 'string' || value instanceof String;
  }

  static isNumber(value: unknown): value is number {
    return typeof value === 'number' || value instanceof Number;
  }

  static async waitForEvent(emitter: NodeJS.EventEmitter, eventName: (string|symbol), predicate: AnyFunction, timeout: number, abortPromise: Promise<Error>): Promise<any> {
    let eventTimeout: ReturnType<typeof setTimeout>, resolveCallback: (event: any) => void, rejectCallback: (e: TimeoutError) => void;
    const promise = new Promise((resolve, reject) => {
      resolveCallback = resolve;
      rejectCallback = reject;
    });
    const listener = Helper.addEventListener(emitter, eventName, event => {
      if (!predicate(event))
        return;
      resolveCallback(event);
    });
    if (timeout) {
      eventTimeout = setTimeout(() => {
        rejectCallback(new TimeoutError('Timeout exceeded while waiting for event'));
      }, timeout);
    }
    function cleanup() {
      Helper.removeEventListeners([listener]);
      clearTimeout(eventTimeout);
    }
    const result = await Promise.race([promise, abortPromise]).then(r => {
      cleanup();
      return r;
    }, e => {
      cleanup();
      throw e;
    });
    if (result instanceof Error)
      throw result;
    return result;
  }

  static async waitWithTimeout<T>(promise: Promise<T>, taskName: string, timeout: number): Promise<T> {
    let reject: (e: TimeoutError) => void;
    const timeoutError = new TimeoutError(`waiting for ${taskName} failed: timeout ${timeout}ms exceeded`);
    const timeoutPromise = new Promise<T>((_resolve, x) => reject = x);
    let timeoutTimer = null;
    if (timeout)
      timeoutTimer = setTimeout(() => reject(timeoutError), timeout);
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutTimer !== null)
        clearTimeout(timeoutTimer);
    }
  }

  static async readProtocolStream(client: CDPSession, handle: string, path?: string | null): Promise<Buffer | null> {
    let eof = false;
    let file: number | undefined;
    if (path)
      file = await openAsync(path, 'w');
    const bufs = [];
    while (!eof) {
      const response = await client.send('IO.read', {handle});
      eof = response.eof;
      const buf = Buffer.from(response.data, response.base64Encoded ? 'base64' : undefined);
      bufs.push(buf);
      if (file !== undefined)
        await writeAsync(file, buf);
    }
    if (file !== undefined)
      await closeAsync(file);
    await client.send('IO.close', {handle});
    let resultBuffer = null;
    try {
      resultBuffer = Buffer.concat(bufs);
    } finally {
      return resultBuffer;
    }
  }
}
