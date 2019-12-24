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

import { Protocol } from 'devtools-protocol';
import { helper, assert } from './helper';
import { createJSHandle, JSHandle, ElementHandle } from './JSHandle';
import { CDPSession } from './Connection';
import { DOMWorld } from './DOMWorld';
import { Frame } from './FrameManager';
import { JSEvalable, EvaluateFn, SerializableOrJSHandle, EvaluateFnReturnType } from './types';

export const EVALUATION_SCRIPT_URL = '__puppeteer_evaluation_script__';
const SOURCE_URL_REGEX = /^[\040\t]*\/\/[@#] sourceURL=\s*(\S*?)\s*$/m;

export class ExecutionContext<T = any> implements JSEvalable<T> {
  private _contextId: number;

  constructor(
    public client: CDPSession,
    contextPayload: Protocol.Runtime.ExecutionContextDescription,
    /* @internal */ public world?: DOMWorld
  ) {
    this._contextId = contextPayload.id;
  }

  public frame(): Frame | null {
    return this.world ? this.world.frame() : null;
  }

  public evaluate<V extends EvaluateFn<T>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<EvaluateFnReturnType<V>> {
    return this._evaluateInternal(true /* returnByValue */, pageFunction, ...args);
  }

  public async evaluateHandle<V extends EvaluateFn<any>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle<EvaluateFnReturnType<V>>> {
    return this._evaluateInternal(false /* returnByValue */, pageFunction, ...args);
  }

  /* @internal */
  public async queryObjects(prototypeHandle: JSHandle): Promise<JSHandle> {
    assert(!prototypeHandle._disposed, 'Prototype JSHandle is disposed!');
    assert(prototypeHandle._remoteObject.objectId, 'Prototype JSHandle must not be referencing primitive value');
    const response = await this.client.send('Runtime.queryObjects', {
      prototypeObjectId: prototypeHandle._remoteObject.objectId
    });
    return createJSHandle(this, response.objects);
  }

  /* @internal */
  public async _adoptElementHandle(elementHandle: ElementHandle): Promise<ElementHandle> {
    assert(
        elementHandle.executionContext() !== this,
        'Cannot adopt handle that already belongs to this execution context'
    );
    assert(this.world, 'Cannot adopt handle without DOMWorld');
    const nodeInfo = await this.client.send('DOM.describeNode', {
      objectId: elementHandle._remoteObject.objectId
    });
    const { object } = await this.client.send('DOM.resolveNode', {
      backendNodeId: nodeInfo.node.backendNodeId,
      executionContextId: this._contextId
    });
    return createJSHandle(this, object) as ElementHandle;
  }

  private async _evaluateInternal(
    returnByValue: boolean,
    pageFunction: EvaluateFn,
    ...args: SerializableOrJSHandle[]
  ): Promise<any> {
    const suffix = `//# sourceURL=${EVALUATION_SCRIPT_URL}`;

    if (helper.isString(pageFunction)) {
      const expressionWithSourceUrl = SOURCE_URL_REGEX.test(pageFunction) ? pageFunction : pageFunction + '\n' + suffix;
      const { exceptionDetails, result: remoteObject } = await this.client
          .send('Runtime.evaluate', {
            expression: expressionWithSourceUrl,
            contextId: this._contextId,
            returnByValue,
            awaitPromise: true,
            userGesture: true
          })
          .catch(rewriteError);

      if (exceptionDetails) throw new Error('Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails));

      return returnByValue ? helper.valueFromRemoteObject(remoteObject) : createJSHandle(this, remoteObject);
    }

    if (typeof pageFunction !== 'function') {
      throw new Error(
          `Expected to get |string| or |function| as the first argument, but got "${pageFunction}" instead.`
      );
    }

    let functionText = pageFunction.toString();
    try {
      new Function('(' + functionText + ')');
    } catch (e1) {
      // This means we might have a function shorthand. Try another
      // time prefixing 'function '.
      if (functionText.startsWith('async ')) functionText = 'async function ' + functionText.substring('async '.length);
      else functionText = 'function ' + functionText;
      try {
        new Function('(' + functionText + ')');
      } catch (e2) {
        // We tried hard to serialize, but there's a weird beast here.
        throw new Error('Passed function is not well-serializable!');
      }
    }
    let callFunctionOnPromise: Promise<Protocol.Runtime.CallFunctionOnResponse>;
    try {
      callFunctionOnPromise = this.client.send('Runtime.callFunctionOn', {
        functionDeclaration: functionText + '\n' + suffix + '\n',
        executionContextId: this._contextId,
        arguments: args.map(convertArgument.bind(this)),
        returnByValue,
        awaitPromise: true,
        userGesture: true
      });
    } catch (err) {
      if (err instanceof TypeError && err.message.startsWith('Converting circular structure to JSON'))
        err.message += ' Are you passing a nested JSHandle?';
      throw err;
    }
    const { exceptionDetails, result: remoteObject } = await callFunctionOnPromise.catch(rewriteError);
    if (exceptionDetails) throw new Error('Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails));
    return returnByValue ? helper.valueFromRemoteObject(remoteObject) : createJSHandle(this, remoteObject);
  }
}

function convertArgument(this: ExecutionContext, arg: unknown): any {
  if (typeof arg === 'bigint') return { unserializableValue: `${arg.toString()}n` };
  if (Object.is(arg, -0)) return { unserializableValue: '-0' };
  if (Object.is(arg, Infinity)) return { unserializableValue: 'Infinity' };
  if (Object.is(arg, -Infinity)) return { unserializableValue: '-Infinity' };
  if (Object.is(arg, NaN)) return { unserializableValue: 'NaN' };
  const objectHandle = arg && arg instanceof JSHandle ? arg : null;
  if (objectHandle) {
    if (objectHandle.context !== this)
      throw new Error('JSHandles can be evaluated only in the context they were created!');
    if (objectHandle._disposed) throw new Error('JSHandle is disposed!');
    if (objectHandle._remoteObject.unserializableValue)
      return { unserializableValue: objectHandle._remoteObject.unserializableValue };
    if (!objectHandle._remoteObject.objectId) return { value: objectHandle._remoteObject.value };
    return { objectId: objectHandle._remoteObject.objectId };
  }
  return { value: arg };
}

function rewriteError(error: Error): Protocol.Runtime.EvaluateResponse {
  if (error.message.includes('Object reference chain is too long')) return { result: { type: 'undefined' } };
  if (error.message.includes(`Object couldn't be returned by value`)) return { result: { type: 'undefined' } };

  if (
    error.message.endsWith('Cannot find context with specified id') ||
    error.message.endsWith('Inspected target navigated or closed')
  )
    throw new Error('Execution context was destroyed, most likely because of a navigation.');
  throw error;
}
