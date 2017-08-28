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

/** @type {?Map<string, boolean>} */
let apiCoverage = null;
class Helper {
  /**
   * @param {function()|string} fun
   * @param {!Array<*>} args
   * @return {string}
   */
  static evaluationString(fun, ...args) {
    if (Helper.isString(fun)) {
      console.assert(args.length === 0, 'Cannot evaluate a string with arguments');
      return fun;
    }
    return `(${fun})(${args.map(x => JSON.stringify(x)).join(',')})`;
  }

  /**
   * @param {!Object} exceptionDetails
   * @return {string}
   */
  static getExceptionMessage(exceptionDetails) {
    if (exceptionDetails.exception)
      return exceptionDetails.exception.description;
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
   * @param {!Session} client
   * @param {!Object} remoteObject
   * @return {!Promise<!Object>}
   */
  static async serializeRemoteObject(client, remoteObject) {
    if (remoteObject.unserializableValue) {
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
    if (!remoteObject.objectId)
      return remoteObject.value;
    if (remoteObject.subtype === 'promise')
      return remoteObject.description;
    try {
      const response = await client.send('Runtime.callFunctionOn', {
        objectId: remoteObject.objectId,
        functionDeclaration: 'function() { return this; }',
        returnByValue: true,
      });
      return response.result.value;
    } catch (e) {
      // Return description for unserializable object, e.g. 'window'.
      return remoteObject.description;
    } finally {
      Helper.releaseObject(client, remoteObject);
    }
  }

  /**
   * @param {!Session} client
   * @param {!Object} remoteObject
   * @return {!Promise}
   */
  static async releaseObject(client, remoteObject) {
    if (!remoteObject.objectId)
      return;
    try {
      await client.send('Runtime.releaseObject', {objectId: remoteObject.objectId});
    } catch (e) {
      // Exceptions might happen in case of a page been navigated or closed.
      // Swallow these since they are harmless and we don't leak anything in this case.
    }
  }

  /**
   * @param {!Object} classType
   */
  static tracePublicAPI(classType) {
    let className = classType.prototype.constructor.name;
    className = className.substring(0, 1).toLowerCase() + className.substring(1);
    const debug = require('debug')(`puppeteer:${className}`);
    if (!debug.enabled && !apiCoverage)
      return;
    for (const methodName of Reflect.ownKeys(classType.prototype)) {
      const method = Reflect.get(classType.prototype, methodName);
      if (methodName === 'constructor' || typeof methodName !== 'string' || methodName.startsWith('_') || typeof method !== 'function')
        continue;
      if (apiCoverage)
        apiCoverage.set(`${className}.${methodName}`, false);
      Reflect.set(classType.prototype, methodName, function(...args) {
        const argsText = args.map(stringifyArgument).join(', ');
        const callsite = `${className}.${methodName}(${argsText})`;
        if (debug.enabled)
          debug(callsite);
        if (apiCoverage)
          apiCoverage.set(`${className}.${methodName}`, true);
        return method.call(this, ...args);
      });
    }

    if (classType.Events) {
      if (apiCoverage) {
        for (const event of Object.values(classType.Events))
          apiCoverage.set(`${className}.emit(${JSON.stringify(event)})`, false);
      }
      const method = Reflect.get(classType.prototype, 'emit');
      Reflect.set(classType.prototype, 'emit', function(event, ...args) {
        const argsText = [JSON.stringify(event)].concat(args.map(stringifyArgument)).join(', ');
        if (debug.enabled && this.listenerCount(event))
          debug(`${className}.emit(${argsText})`);
        if (apiCoverage && this.listenerCount(event))
          apiCoverage.set(`${className}.emit(${JSON.stringify(event)})`, true);
        return method.call(this, event, ...args);
      });
    }

    /**
     * @param {!Object} arg
     * @return {string}
     */
    function stringifyArgument(arg) {
      if (Helper.isString(arg) || Helper.isNumber(arg) || !arg)
        return JSON.stringify(arg);
      if (typeof arg === 'function') {
        let text = arg.toString().split('\n').map(line => line.trim()).join('');
        if (text.length > 20)
          text = text.substring(0, 20) + '…';
        return `"${text}"`;
      }
      const state = {};
      const keys = Object.keys(arg);
      for (const key of keys) {
        const value = arg[key];
        if (Helper.isString(value) || Helper.isNumber(value))
          state[key] = JSON.stringify(value);
      }
      const name = arg.constructor.name === 'Object' ? '' : arg.constructor.name;
      return name + JSON.stringify(state);
    }
  }

  /**
   * @param {!EventEmitter} emitter
   * @param {string} eventName
   * @param {function(?)} handler
   * @return {{emitter: !EventEmitter, eventName: string, handler: function(?)}}
   */
  static addEventListener(emitter, eventName, handler) {
    emitter.on(eventName, handler);
    return { emitter, eventName, handler };
  }

  /**
   * @param {!Array<{emitter: !EventEmitter, eventName: string, handler: function(?)}>}
   */
  static removeEventListeners(listeners) {
    for (const listener of listeners)
      listener.emitter.removeListener(listener.eventName, listener.handler);
    listeners.splice(0, listeners.length);
  }

  /**
   * @return {?Map<string, boolean>}
   */
  static publicAPICoverage() {
    return apiCoverage;
  }

  static recordPublicAPICoverage() {
    apiCoverage = new Map();
  }

  /**
   * @param {!Object} obj
   * @return {boolean}
   */
  static isString(obj) {
    return typeof obj === 'string' || obj instanceof String;
  }

  /**
   * @param {!Object} obj
   * @return {boolean}
   */
  static isNumber(obj) {
    return typeof obj === 'number' || obj instanceof Number;
  }
}

module.exports = Helper;
