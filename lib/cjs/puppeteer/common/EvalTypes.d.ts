/**
 * Copyright 2020 Google Inc. All rights reserved.
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
import { JSHandle, ElementHandle } from './JSHandle.js';
/**
 * @public
 */
export declare type EvaluateFn<T = any> = string | ((arg1: T, ...args: any[]) => any);
export declare type UnwrapPromiseLike<T> = T extends PromiseLike<infer U> ? U : T;
/**
 * @public
 */
export declare type EvaluateFnReturnType<T extends EvaluateFn> = T extends (...args: any[]) => infer R ? R : any;
/**
 * @public
 */
export declare type EvaluateHandleFn = string | ((...args: any[]) => any);
/**
 * @public
 */
export declare type Serializable = number | string | boolean | null | BigInt | JSONArray | JSONObject;
/**
 * @public
 */
export declare type JSONArray = Serializable[];
/**
 * @public
 */
export interface JSONObject {
    [key: string]: Serializable;
}
/**
 * @public
 */
export declare type SerializableOrJSHandle = Serializable | JSHandle;
/**
 *  Wraps a DOM element into an ElementHandle instance
 * @public
 **/
export declare type WrapElementHandle<X> = X extends Element ? ElementHandle<X> : X;
/**
 *  Unwraps a DOM element out of an ElementHandle instance
 * @public
 **/
export declare type UnwrapElementHandle<X> = X extends ElementHandle<infer E> ? E : X;
//# sourceMappingURL=EvalTypes.d.ts.map