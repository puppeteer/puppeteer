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

class Helper {
  /**
   * @param {function()} fun
   * @param {!Array<*>} args
   * @return {string}
   */
  static evaluationString(fun, ...args) {
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
      for (let callframe of exceptionDetails.stackTrace.callFrames) {
        let location = callframe.url + ':' + callframe.lineNumber + ':' + callframe.columnNumber;
        let functionName = callframe.functionName || '<anonymous>';
        message += `\n    at ${functionName} (${location})`;
      }
    }
    return message;
  }

  /**
   * @param {!Connection} client
   * @param {!Object} remoteObject
   * @return {!Object}
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
    try {
      let response = await client.send('Runtime.callFunctionOn', {
        objectId: remoteObject.objectId,
        functionDeclaration: 'function() { return this; }',
        returnByValue: true,
      });
      return response.result.value;
    } catch (e) {
      // Return description for unserializable object, e.g. 'window'.
      return remoteObject.description;
    } finally {
      client.send('Runtime.releaseObject', {objectId: remoteObject.objectId}).catch(e => {
        // While we were serializing object, the page might've navigated.
      });
    }
  }

  /**
   * @param {!Object} classType
   */
  static tracePublicAPI(classType) {
    let className = classType.prototype.constructor.name;
    className = className.substring(0, 1).toLowerCase() + className.substring(1);
    const debug = require('debug')(`puppeteer:${className}`);
    if (!debug.enabled)
      return;
    for (let methodName of Reflect.ownKeys(classType.prototype)) {
      const method = Reflect.get(classType.prototype, methodName);
      if (methodName === 'constructor' || methodName.startsWith('_') || typeof method !== 'function')
        continue;
      Reflect.set(classType.prototype, methodName, function(...args) {
        let argsText = args.map(stringifyArgument).join(', ');
        let callsite = `${className}.${methodName}(${argsText})`;
        debug(callsite);
        return method.call(this, ...args);
      });
    }

    /**
     * @param {!Object} arg
     * @return {string}
     */
    function stringifyArgument(arg) {
      if (typeof arg !== 'function')
        return JSON.stringify(arg);
      let text = arg.toString().split('\n').map(line => line.trim()).join('');
      if (text.length > 20)
        text = text.substring(0, 20) + '…';
      return `"${text}"`;
    }
  }
}

module.exports = Helper;
