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
import {TimeoutError} from './Errors';
const debugError = require('debug')(`puppeteer:error`);
import fs from 'fs';

class Helper {
  /**
   * @param {Function|string} fun
   * @param {!Array<*>} args
   * @return {string}
   */
  static evaluationString(fun: Function|string, ...args: Array<any>): string {
    if (Helper.isString(fun)) {
      assert(args.length === 0, 'Cannot evaluate a string with arguments');
      return /** @type {string} */ (fun);
    }
    return `(${fun})(${args.map(serializeArgument).join(',')})`;

    /**
     * @param {*} arg
     * @return {string}
     */
    function serializeArgument(arg: any): string {
      if (Object.is(arg, undefined))
        return 'undefined';
      return JSON.stringify(arg);
    }
  }

  /**
   * @param {!Protocol.Runtime.ExceptionDetails} exceptionDetails
   * @return {string}
   */
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

  /**
   * @param {!Protocol.Runtime.RemoteObject} remoteObject
   * @return {*}
   */
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

  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!Protocol.Runtime.RemoteObject} remoteObject
   */
  static async releaseObject(client: CDPSession, remoteObject: Protocol.Runtime.RemoteObject) {
    if (!remoteObject.objectId)
      return;
    await client.send('Runtime.releaseObject', {objectId: remoteObject.objectId}).catch(error => {
      // Exceptions might happen in case of a page been navigated or closed.
      // Swallow these since they are harmless and we don't leak anything in this case.
      debugError(error);
    });
  }

  /**
   * @param {!Object} classType
   */
  static installAsyncStackHooks(classType: object) {
    for (const methodName of Reflect.ownKeys(classType.prototype)) {
      const method = Reflect.get(classType.prototype, methodName);
      if (methodName === 'constructor' || typeof methodName !== 'string' || methodName.startsWith('_') || typeof method !== 'function' || method.constructor.name !== 'AsyncFunction')
        continue;
      Reflect.set(classType.prototype, methodName, function(...args) {
        const syncStack = {};
        Error.captureStackTrace(syncStack);
        return method.call(this, ...args).catch(e => {
          const stack = syncStack.stack.substring(syncStack.stack.indexOf('\n') + 1);
          const clientStack = stack.substring(stack.indexOf('\n'));
          if (e instanceof Error && e.stack && !e.stack.includes(clientStack))
            e.stack += '\n  -- ASYNC --\n' + stack;
          throw e;
        });
      });
    }
  }

  /**
   * @param {!NodeJS.EventEmitter} emitter
   * @param {(string|symbol)} eventName
   * @param {function(?):void} handler
   * @return {{emitter: !NodeJS.EventEmitter, eventName: (string|symbol), handler: function(?)}}
   */
  static addEventListener(emitter: NodeJS.EventEmitter, eventName: (string|symbol), handler: (...args: any[]) => void): {emitter: NodeJS.EventEmitter, eventName: (string|symbol), handler: function(?)} {
    emitter.on(eventName, handler);
    return { emitter, eventName, handler };
  }

  /**
   * @param {!Array<{emitter: !NodeJS.EventEmitter, eventName: (string|symbol), handler: function(?):void}>} listeners
   */
  static removeEventListeners(listeners: Array<{emitter: NodeJS.EventEmitter, eventName: (string|symbol), handler: (...args: any[]) => void}>) {
    for (const listener of listeners)
      listener.emitter.removeListener(listener.eventName, listener.handler);
    listeners.length = 0;
  }

  /**
   * @param {!Object} obj
   * @return {boolean}
   */
  static isString(obj: object): boolean {
    return typeof obj === 'string' || obj instanceof String;
  }

  /**
   * @param {!Object} obj
   * @return {boolean}
   */
  static isNumber(obj: object): boolean {
    return typeof obj === 'number' || obj instanceof Number;
  }

  /**
   * @param {function} nodeFunction
   * @return {function}
   */
  static promisify(nodeFunction: AnyFunction): AnyFunction {
    function promisified(...args) {
      return new Promise((resolve, reject) => {
        function callback(err, ...result) {
          if (err)
            return reject(err);
          if (result.length === 1)
            return resolve(result[0]);
          return resolve(result);
        }
        nodeFunction.call(null, ...args, callback);
      });
    }
    return promisified;
  }

  /**
   * @param {!NodeJS.EventEmitter} emitter
   * @param {(string|symbol)} eventName
   * @param {function} predicate
   * @param {number} timeout
   * @param {!Promise<!Error>} abortPromise
   * @return {!Promise}
   */
  static async waitForEvent(emitter: NodeJS.EventEmitter, eventName: (string|symbol), predicate: AnyFunction, timeout: number, abortPromise: Promise<Error>): Promise<void> {
    let eventTimeout, resolveCallback, rejectCallback;
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

  /**
   * @template T
   * @param {!Promise<T>} promise
   * @param {string} taskName
   * @param {number} timeout
   * @return {!Promise<T>}
   */
  static async waitWithTimeout(promise: Promise<T>, taskName: string, timeout: number): Promise<T> {
    let reject;
    const timeoutError = new TimeoutError(`waiting for ${taskName} failed: timeout ${timeout}ms exceeded`);
    const timeoutPromise = new Promise((resolve, x) => reject = x);
    let timeoutTimer = null;
    if (timeout)
      timeoutTimer = setTimeout(() => reject(timeoutError), timeout);
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutTimer)
        clearTimeout(timeoutTimer);
    }
  }

  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {string} handle
   * @param {?string} path
   * @return {!Promise<!Buffer>}
   */
  static async readProtocolStream(client: CDPSession, handle: string, path?: string): Promise<Buffer> {
    let eof = false;
    let file;
    if (path)
      file = await openAsync(path, 'w');
    const bufs = [];
    while (!eof) {
      const response = await client.send('IO.read', {handle});
      eof = response.eof;
      const buf = Buffer.from(response.data, response.base64Encoded ? 'base64' : undefined);
      bufs.push(buf);
      if (path)
        await writeAsync(file, buf);
    }
    if (path)
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

const openAsync = Helper.promisify(fs.open);
const writeAsync = Helper.promisify(fs.write);
const closeAsync = Helper.promisify(fs.close);

/**
 * @param {*} value
 * @param {string=} message
 */
function assert(value: any, message?: string) {
  if (!value)
    throw new Error(message);
}

export {
  helper: Helper,
  assert,
  debugError
};
