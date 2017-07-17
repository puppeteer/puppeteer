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
   * @param {!Connection} client
   * @param {!Object} exceptionDetails
   * @return {string}
   */
  static async getExceptionMessage(client, exceptionDetails) {
    let message = '';
    let exception = exceptionDetails.exception;
    if (exception) {
      let response = await client.send('Runtime.callFunctionOn', {
        objectId: exception.objectId,
        functionDeclaration: 'function() { return this.message; }',
        returnByValue: true,
      });
      message = response.result.value;
    } else {
      message = exceptionDetails.text;
    }

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
    let response = await client.send('Runtime.callFunctionOn', {
      objectId: remoteObject.objectId,
      functionDeclaration: 'function() { return this; }',
      returnByValue: true,
    });
    client.send('Runtime.releaseObject', {objectId: remoteObject.objectId});
    return response.result.value;
  }
}

module.exports = Helper;
