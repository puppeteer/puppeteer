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

import { assert } from './assert.js';
import { helper } from './helper.js';
import { createJSHandle, JSHandle, ElementHandle } from './JSHandle.js';
import { CDPSession } from './Connection.js';
import { DOMWorld } from './DOMWorld.js';
import { Frame } from './FrameManager.js';
import { Protocol } from 'devtools-protocol';
import { EvaluateHandleFn, SerializableOrJSHandle } from './EvalTypes.js';
/**
 * @public
 */
export const EVALUATION_SCRIPT_URL = '__puppeteer_evaluation_script__';
const SOURCE_URL_REGEX = /^[\040\t]*\/\/[@#] sourceURL=\s*(\S*?)\s*$/m;

/**
 * This class represents a context for JavaScript execution. A [Page] might have
 * many execution contexts:
 * - each
 *   {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe |
 *   frame } has "default" execution context that is always created after frame is
 *   attached to DOM. This context is returned by the
 *   {@link Frame.executionContext} method.
 * - {@link https://developer.chrome.com/extensions | Extension}'s content scripts
 *   create additional execution contexts.
 *
 * Besides pages, execution contexts can be found in
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API |
 * workers }.
 *
 * @public
 */
export class ExecutionContext {
  /**
   * @internal
   */
  _client: CDPSession;
  /**
   * @internal
   */
  _world: DOMWorld;
  /**
   * @internal
   */
  _contextId: number;
  /**
   * @internal
   */
  _contextName: string;

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    contextPayload: Protocol.Runtime.ExecutionContextDescription,
    world: DOMWorld
  ) {
    this._client = client;
    this._world = world;
    this._contextId = contextPayload.id;
    this._contextName = contextPayload.name;
  }

  /**
   * @remarks
   *
   * Not every execution context is associated with a frame. For
   * example, workers and extensions have execution contexts that are not
   * associated with frames.
   *
   * @returns The frame associated with this execution context.
   */
  frame(): Frame | null {
    return this._world ? this._world.frame() : null;
  }

  /**
   * @remarks
   * If the function passed to the `executionContext.evaluate` returns a
   * Promise, then `executionContext.evaluate` would wait for the promise to
   * resolve and return its value. If the function passed to the
   * `executionContext.evaluate` returns a non-serializable value, then
   * `executionContext.evaluate` resolves to `undefined`. DevTools Protocol also
   * supports transferring some additional values that are not serializable by
   * `JSON`: `-0`, `NaN`, `Infinity`, `-Infinity`, and bigint literals.
   *
   *
   * @example
   * ```js
   * const executionContext = await page.mainFrame().executionContext();
   * const result = await executionContext.evaluate(() => Promise.resolve(8 * 7))* ;
   * console.log(result); // prints "56"
   * ```
   *
   * @example
   * A string can also be passed in instead of a function.
   *
   * ```js
   * console.log(await executionContext.evaluate('1 + 2')); // prints "3"
   * ```
   *
   * @example
   * {@link JSHandle} instances can be passed as arguments to the
   * `executionContext.* evaluate`:
   * ```js
   * const oneHandle = await executionContext.evaluateHandle(() => 1);
   * const twoHandle = await executionContext.evaluateHandle(() => 2);
   * const result = await executionContext.evaluate(
   *    (a, b) => a + b, oneHandle, * twoHandle
   * );
   * await oneHandle.dispose();
   * await twoHandle.dispose();
   * console.log(result); // prints '3'.
   * ```
   * @param pageFunction - a function to be evaluated in the `executionContext`
   * @param args - argument to pass to the page function
   *
   * @returns A promise that resolves to the return value of the given function.
   */
  async evaluate<ReturnType extends any>(
    pageFunction: Function | string,
    ...args: unknown[]
  ): Promise<ReturnType> {
    return await this._evaluateInternal<ReturnType>(
      true,
      pageFunction,
      ...args
    );
  }

  /**
   * @remarks
   * The only difference between `executionContext.evaluate` and
   * `executionContext.evaluateHandle` is that `executionContext.evaluateHandle`
   * returns an in-page object (a {@link JSHandle}).
   * If the function passed to the `executionContext.evaluateHandle` returns a
   * Promise, then `executionContext.evaluateHandle` would wait for the
   * promise to resolve and return its value.
   *
   * @example
   * ```js
   * const context = await page.mainFrame().executionContext();
   * const aHandle = await context.evaluateHandle(() => Promise.resolve(self));
   * aHandle; // Handle for the global object.
   * ```
   *
   * @example
   * A string can also be passed in instead of a function.
   *
   * ```js
   * // Handle for the '3' * object.
   * const aHandle = await context.evaluateHandle('1 + 2');
   * ```
   *
   * @example
   * JSHandle instances can be passed as arguments
   * to the `executionContext.* evaluateHandle`:
   *
   * ```js
   * const aHandle = await context.evaluateHandle(() => document.body);
   * const resultHandle = await context.evaluateHandle(body => body.innerHTML, * aHandle);
   * console.log(await resultHandle.jsonValue()); // prints body's innerHTML
   * await aHandle.dispose();
   * await resultHandle.dispose();
   * ```
   *
   * @param pageFunction - a function to be evaluated in the `executionContext`
   * @param args - argument to pass to the page function
   *
   * @returns A promise that resolves to the return value of the given function
   * as an in-page object (a {@link JSHandle}).
   */
  async evaluateHandle<HandleType extends JSHandle | ElementHandle = JSHandle>(
    pageFunction: EvaluateHandleFn,
    ...args: SerializableOrJSHandle[]
  ): Promise<HandleType> {
    return this._evaluateInternal<HandleType>(false, pageFunction, ...args);
  }

  private async _evaluateInternal<ReturnType>(
    returnByValue: boolean,
    pageFunction: Function | string,
    ...args: unknown[]
  ): Promise<ReturnType> {
    const suffix = `//# sourceURL=${EVALUATION_SCRIPT_URL}`;

    if (helper.isString(pageFunction)) {
      const contextId = this._contextId;
      const expression = pageFunction;
      const expressionWithSourceUrl = SOURCE_URL_REGEX.test(expression)
        ? expression
        : expression + '\n' + suffix;

      const { exceptionDetails, result: remoteObject } = await this._client
        .send('Runtime.evaluate', {
          expression: expressionWithSourceUrl,
          contextId,
          returnByValue,
          awaitPromise: true,
          userGesture: true,
        })
        .catch(rewriteError);

      if (exceptionDetails)
        throw new Error(
          'Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails)
        );

      return returnByValue
        ? helper.valueFromRemoteObject(remoteObject)
        : createJSHandle(this, remoteObject);
    }

    if (typeof pageFunction !== 'function')
      throw new Error(
        `Expected to get |string| or |function| as the first argument, but got "${pageFunction}" instead.`
      );

    let functionText = pageFunction.toString();
    try {
      new Function('(' + functionText + ')');
    } catch (error) {
      // This means we might have a function shorthand. Try another
      // time prefixing 'function '.
      if (functionText.startsWith('async '))
        functionText =
          'async function ' + functionText.substring('async '.length);
      else functionText = 'function ' + functionText;
      try {
        new Function('(' + functionText + ')');
      } catch (error) {
        // We tried hard to serialize, but there's a weird beast here.
        throw new Error('Passed function is not well-serializable!');
      }
    }
    let callFunctionOnPromise;
    try {
      callFunctionOnPromise = this._client.send('Runtime.callFunctionOn', {
        functionDeclaration: functionText + '\n' + suffix + '\n',
        executionContextId: this._contextId,
        arguments: args.map(convertArgument.bind(this)),
        returnByValue,
        awaitPromise: true,
        userGesture: true,
      });
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.startsWith('Converting circular structure to JSON')
      )
        error.message += ' Are you passing a nested JSHandle?';
      throw error;
    }
    const {
      exceptionDetails,
      result: remoteObject,
    } = await callFunctionOnPromise.catch(rewriteError);
    if (exceptionDetails)
      throw new Error(
        'Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails)
      );
    return returnByValue
      ? helper.valueFromRemoteObject(remoteObject)
      : createJSHandle(this, remoteObject);

    /**
     * @param {*} arg
     * @returns {*}
     * @this {ExecutionContext}
     */
    function convertArgument(this: ExecutionContext, arg: unknown): unknown {
      if (typeof arg === 'bigint')
        // eslint-disable-line valid-typeof
        return { unserializableValue: `${arg.toString()}n` };
      if (Object.is(arg, -0)) return { unserializableValue: '-0' };
      if (Object.is(arg, Infinity)) return { unserializableValue: 'Infinity' };
      if (Object.is(arg, -Infinity))
        return { unserializableValue: '-Infinity' };
      if (Object.is(arg, NaN)) return { unserializableValue: 'NaN' };
      const objectHandle = arg && arg instanceof JSHandle ? arg : null;
      if (objectHandle) {
        if (objectHandle._context !== this)
          throw new Error(
            'JSHandles can be evaluated only in the context they were created!'
          );
        if (objectHandle._disposed) throw new Error('JSHandle is disposed!');
        if (objectHandle._remoteObject.unserializableValue)
          return {
            unserializableValue: objectHandle._remoteObject.unserializableValue,
          };
        if (!objectHandle._remoteObject.objectId)
          return { value: objectHandle._remoteObject.value };
        return { objectId: objectHandle._remoteObject.objectId };
      }
      return { value: arg };
    }

    function rewriteError(error: Error): Protocol.Runtime.EvaluateResponse {
      if (error.message.includes('Object reference chain is too long'))
        return { result: { type: 'undefined' } };
      if (error.message.includes("Object couldn't be returned by value"))
        return { result: { type: 'undefined' } };

      if (
        error.message.endsWith('Cannot find context with specified id') ||
        error.message.endsWith('Inspected target navigated or closed')
      )
        throw new Error(
          'Execution context was destroyed, most likely because of a navigation.'
        );
      throw error;
    }
  }

  /**
   * This method iterates the JavaScript heap and finds all the objects with the
   * given prototype.
   * @remarks
   * @example
   * ```js
   * // Create a Map object
   * await page.evaluate(() => window.map = new Map());
   * // Get a handle to the Map object prototype
   * const mapPrototype = await page.evaluateHandle(() => Map.prototype);
   * // Query all map instances into an array
   * const mapInstances = await page.queryObjects(mapPrototype);
   * // Count amount of map objects in heap
   * const count = await page.evaluate(maps => maps.length, mapInstances);
   * await mapInstances.dispose();
   * await mapPrototype.dispose();
   * ```
   *
   * @param prototypeHandle - a handle to the object prototype
   *
   * @returns A handle to an array of objects with the given prototype.
   */
  async queryObjects(prototypeHandle: JSHandle): Promise<JSHandle> {
    assert(!prototypeHandle._disposed, 'Prototype JSHandle is disposed!');
    assert(
      prototypeHandle._remoteObject.objectId,
      'Prototype JSHandle must not be referencing primitive value'
    );
    const response = await this._client.send('Runtime.queryObjects', {
      prototypeObjectId: prototypeHandle._remoteObject.objectId,
    });
    return createJSHandle(this, response.objects);
  }

  /**
   * @internal
   */
  async _adoptBackendNodeId(
    backendNodeId: Protocol.DOM.BackendNodeId
  ): Promise<ElementHandle> {
    const { object } = await this._client.send('DOM.resolveNode', {
      backendNodeId: backendNodeId,
      executionContextId: this._contextId,
    });
    return createJSHandle(this, object) as ElementHandle;
  }

  /**
   * @internal
   */
  async _adoptElementHandle(
    elementHandle: ElementHandle
  ): Promise<ElementHandle> {
    assert(
      elementHandle.executionContext() !== this,
      'Cannot adopt handle that already belongs to this execution context'
    );
    assert(this._world, 'Cannot adopt handle without DOMWorld');
    const nodeInfo = await this._client.send('DOM.describeNode', {
      objectId: elementHandle._remoteObject.objectId,
    });
    return this._adoptBackendNodeId(nodeInfo.node.backendNodeId);
  }
}
