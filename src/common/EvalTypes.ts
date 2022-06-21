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
import TypedArray = NodeJS.TypedArray;

/**
 * Unwrap handles for a page function
 * @public
 */
export type PassedArgs<Args extends SerializableOrJSHandle[]> = {
  [K in keyof Args]: UnwrapHandle<Args[K]>;
};

/**
 * Get processed return value of {@link EvaluateFn} or {@link EvaluateSubjectFn}
 * @public
 */
export type EvaluateReturn<Func extends (...args: never) => unknown> =
  DeserializedValue<Awaited<ReturnType<Func>>>;

/**
 * @public
 */
export type DeserializedValue<T> = T extends bigint
  ? T
  : T extends undefined | symbol
  ? undefined
  : CDPSerialized<T>;

/**
 * Try to simulate type from serialized then deserialized DevTools objects,
 * similar to `JSON.parse(JSON.stringify(T))` but different for functions
 * @public
 */
// Should also convert number keys to strings,
//  but `{ [K in `${number & keyof T}`]: JSONSerialized<T[K]> }` does not work
export type CDPSerialized<T> = T extends void
  ? void
  : T extends number | string | boolean | null
  ? T
  : T extends undefined | symbol
  ? never
  : T extends bigint
  ? never // throws
  : T extends { toJSON(): infer V }
  ? V
  : T extends
      | Node
      | RegExp
      | Map<unknown, unknown>
      | Set<unknown>
      | WeakMap<object, unknown>
      | WeakSet<object>
      | Iterator<unknown, never, never>
      | Error
      | Promise<unknown>
      | TypedArray
      | ArrayBuffer
      | DataView
  ? Record<string, never>
  : T extends unknown[]
  ? { [K in keyof T]: CDPSerialized<T[K]> }
  : { [K in (string | number) & keyof T]: CDPSerialized<T[K]> };

/**
 * Get processed return value of {@link EvaluateHandleFn} or
 * {@link EvaluateHandleSubjectFn}
 * @public
 */
// Nicer would be to say it always returns ElementHandle if type extends ParentNode,
//  but this is not the case if the handle does not have a frame,
//  see `import('./JSHandle.js').createJSHandle`
export type EvaluateHandleReturn<Func extends (...args: never) => unknown> =
  JSHandle<Awaited<ReturnType<Func>>>;

/**
 * Get processed return value of {@link EvaluateHandleFn}
 * for when {@link ExecutionContext.frame} is known to be non-`null`
 * @public
 */
export type EvaluateHandleElementReturn<
  Func extends (...args: never) => unknown
> = Awaited<ReturnType<Func>> extends ParentNode
  ? ElementHandle<Awaited<ReturnType<Func>>>
  : JSHandle<Awaited<ReturnType<Func>>>;

/**
 * @public
 */
// Currently identical to `EvaluateHandleFn`,
//  but let's make these separate types anyway for forwards compatibility
export type EvaluateFn<
  Args extends SerializableOrJSHandle[] = SerializableOrJSHandle[],
  Return = unknown
> = (...args: PassedArgs<Args>) => Return;

/**
 * @public
 */
export type EvaluateHandleFn<
  Args extends SerializableOrJSHandle[] = SerializableOrJSHandle[],
  Return = unknown
> = (...args: PassedArgs<Args>) => Return;

/**
 * @public
 */
export type EvaluateSubjectFn<
  Subject = unknown,
  Args extends SerializableOrJSHandle[] = SerializableOrJSHandle[],
  Return = unknown
> = (subject: Subject, ...args: PassedArgs<Args>) => Return;

/**
 * @public
 */
export type EvaluateHandleSubjectFn<
  Subject = unknown,
  Args extends SerializableOrJSHandle[] = SerializableOrJSHandle[],
  Return = unknown
> = (subject: Subject, ...args: PassedArgs<Args>) => Return;

/**
 * Unwrap returned handle from an exposed function to use the type in the page
 * @public
 */
export type ExposedFunctionToInPage<Func extends (...args: never) => unknown> =
  (
    ...args: Parameters<Func>
  ) => ReturnType<Func> extends PromiseLike<unknown>
    ? Promise<UnwrapHandle<Awaited<ReturnType<Func>>>>
    : UnwrapHandle<Awaited<ReturnType<Func>>>;

/**
 * @deprecated Use `Awaited` instead
 * @public
 */
export type UnwrapPromiseLike<T> = Awaited<T>;

/**
 * @public
 */
// It is intentional that object/array contents are not `Serializable`
export type Serializable = undefined | bigint | JSONSerializable;

/**
 * A value which is directly serializable as JSON
 * @public
 */
export type JSONSerializable =
  | number
  | string
  | boolean
  | null
  | readonly JSONSerializable[]
  | { [key: string]: JSONSerializable };

/**
 * @public
 */
export type SerializableOrJSHandle = Serializable | JSHandle;

/**
 * Currently no `bigint` and no special numbers (`NaN`, `Infinity`, ...)
 * @public
 */
export type ConstantSerializable = undefined | JSONSerializable;

/**
 * Wraps a DOM element into an ElementHandle instance
 * @public
 */
export type WrapElementHandle<X> = X extends Element ? ElementHandle<X> : X;

/**
 * Unwraps a DOM element out of an ElementHandle instance
 * @public
 */
export type UnwrapElementHandle<X> = X extends ElementHandle<infer E> ? E : X;

/**
 * @public
 */
export type UnwrapHandle<X> = X extends JSHandle<infer U> ? U : X;
