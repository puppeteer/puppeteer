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

const {helper} = require('./helper');

class ExecutionContext {
  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!Protocol.Runtime.ExecutionContextDescription} contextPayload
   * @param {function(*):!JSHandle} objectHandleFactory
   * @param {?Puppeteer.Frame} frame
   */
  constructor(client, contextPayload, objectHandleFactory, frame) {
    this._client = client;
    this._frame = frame;
    this._contextId = contextPayload.id;
    this._objectHandleFactory = objectHandleFactory;
  }

  /**
   * @return {?Puppeteer.Frame}
   */
  frame() {
    return this._frame;
  }

  /**
   * @param {Function|string} pageFunction
   * @param {...*} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async evaluate(pageFunction, ...args) {
    const handle = await this.evaluateHandle(pageFunction, ...args);
    const result = await handle.jsonValue().catch(error => {
      if (error.message.includes('Object reference chain is too long'))
        return;
      if (error.message.includes('Object couldn\'t be returned by value'))
        return;
      throw error;
    });
    await handle.dispose();
    return result;
  }

  /**
   * @param {Function|string} pageFunction
   * @param {...*} args
   * @return {!Promise<!JSHandle>}
   */
  async evaluateHandle(pageFunction, ...args) {
    if (helper.isString(pageFunction)) {
      const contextId = this._contextId;
      const expression = /** @type {string} */ (pageFunction);
      const { exceptionDetails, result: remoteObject } = await this._client.send('Runtime.evaluate', { expression, contextId, returnByValue: false, awaitPromise: true});
      if (exceptionDetails)
        throw new Error('Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails));
      return this._objectHandleFactory(remoteObject);
    }

    const { exceptionDetails, result: remoteObject } = await this._client.send('Runtime.callFunctionOn', {
      functionDeclaration: pageFunction.toString(),
      executionContextId: this._contextId,
      arguments: args.map(convertArgument.bind(this)),
      returnByValue: false,
      awaitPromise: true
    });
    if (exceptionDetails)
      throw new Error('Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails));
    return this._objectHandleFactory(remoteObject);

    /**
     * @param {*} arg
     * @return {*}
     * @this {Frame}
     */
    function convertArgument(arg) {
      if (Object.is(arg, -0))
        return { unserializableValue: '-0' };
      if (Object.is(arg, Infinity))
        return { unserializableValue: 'Infinity' };
      if (Object.is(arg, -Infinity))
        return { unserializableValue: '-Infinity' };
      if (Object.is(arg, NaN))
        return { unserializableValue: 'NaN' };
      const objectHandle = arg && (arg instanceof JSHandle) ? arg : null;
      if (objectHandle) {
        if (objectHandle._context !== this)
          throw new Error('JSHandles can be evaluated only in the context they were created!');
        if (objectHandle._disposed)
          throw new Error('JSHandle is disposed!');
        if (objectHandle._remoteObject.unserializableValue)
          return { unserializableValue: objectHandle._remoteObject.unserializableValue };
        if (!objectHandle._remoteObject.objectId)
          return { value: objectHandle._remoteObject.value };
        return { objectId: objectHandle._remoteObject.objectId };
      }
      return { value: arg };
    }
  }

  /**
   * @param {!JSHandle} prototypeHandle
   * @return {!Promise<!JSHandle>}
   */
  async queryObjects(prototypeHandle) {
    console.assert(!prototypeHandle._disposed, 'Prototype JSHandle is disposed!');
    console.assert(prototypeHandle._remoteObject.objectId, 'Prototype JSHandle must not be referencing primitive value');
    const response = await this._client.send('Runtime.queryObjects', {
      prototypeObjectId: prototypeHandle._remoteObject.objectId
    });
    return this._objectHandleFactory(response.objects);
  }
}

class JSHandle {
  /**
   * @param {!ExecutionContext} context
   * @param {!Puppeteer.CDPSession} client
   * @param {!Protocol.Runtime.RemoteObject} remoteObject
   */
  constructor(context, client, remoteObject) {
    this._context = context;
    this._client = client;
    this._remoteObject = remoteObject;
    this._disposed = false;
  }

  /**
   * @return {!ExecutionContext}
   */
  executionContext() {
    return this._context;
  }

  /**
   * @param {string} propertyName
   * @return {!Promise<?JSHandle>}
   */
  async getProperty(propertyName) {
    const objectHandle = await this._context.evaluateHandle((object, propertyName) => {
      const result = {__proto__: null};
      result[propertyName] = object[propertyName];
      return result;
    }, this, propertyName);
    const properties = await objectHandle.getProperties();
    const result = properties.get(propertyName) || null;
    await objectHandle.dispose();
    return result;
  }

  /**
   * @return {!Promise<Map<string, !JSHandle>>}
   */
  async getProperties() {
    const response = await this._client.send('Runtime.getProperties', {
      objectId: this._remoteObject.objectId,
      ownProperties: true
    });
    const result = new Map();
    for (const property of response.result) {
      if (!property.enumerable)
        continue;
      result.set(property.name, this._context._objectHandleFactory(property.value));
    }
    return result;
  }

  /**
   * @return {!Promise<?Object>}
   */
  async jsonValue() {
    if (this._remoteObject.objectId) {
      const response = await this._client.send('Runtime.callFunctionOn', {
        functionDeclaration: 'function() { return this; }',
        objectId: this._remoteObject.objectId,
        returnByValue: true,
        awaitPromise: true,
      });
      return helper.valueFromRemoteObject(response.result);
    }
    return helper.valueFromRemoteObject(this._remoteObject);
  }

  /**
   * @return {?Puppeteer.ElementHandle}
   */
  asElement() {
    return null;
  }

  async dispose() {
    if (this._disposed)
      return;
    this._disposed = true;
    await helper.releaseObject(this._client, this._remoteObject);
  }

  /**
   * @override
   * @return {string}
   */
  toString() {
    if (this._remoteObject.objectId) {
      const type =  this._remoteObject.subtype || this._remoteObject.type;
      return 'JSHandle@' + type;
    }
    return 'JSHandle:' + helper.valueFromRemoteObject(this._remoteObject);
  }
}

helper.tracePublicAPI(JSHandle);
module.exports = {ExecutionContext, JSHandle};
