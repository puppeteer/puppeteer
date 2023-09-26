/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import type {Disposed, Moveable} from '../common/types.js';

import {asyncDisposeSymbol, disposeSymbol} from './disposable.js';
import {Mutex} from './Mutex.js';

const instances = new WeakSet<object>();

export function moveable<
  Class extends abstract new (...args: never[]) => Moveable,
>(Class: Class, _: ClassDecoratorContext<Class>): Class {
  let hasDispose = false;
  if (Class.prototype[disposeSymbol]) {
    const dispose = Class.prototype[disposeSymbol];
    Class.prototype[disposeSymbol] = function (this: InstanceType<Class>) {
      if (instances.has(this)) {
        instances.delete(this);
        return;
      }
      return dispose.call(this);
    };
    hasDispose = true;
  }
  if (Class.prototype[asyncDisposeSymbol]) {
    const asyncDispose = Class.prototype[asyncDisposeSymbol];
    Class.prototype[asyncDisposeSymbol] = function (this: InstanceType<Class>) {
      if (instances.has(this)) {
        instances.delete(this);
        return;
      }
      return asyncDispose.call(this);
    };
    hasDispose = true;
  }
  if (hasDispose) {
    Class.prototype.move = function (
      this: InstanceType<Class>
    ): InstanceType<Class> {
      instances.add(this);
      return this;
    };
  }
  return Class;
}

export function throwIfDisposed<This extends Disposed>(
  message: (value: This) => string = value => {
    return `Attempted to use disposed ${value.constructor.name}.`;
  }
) {
  return (target: (this: This, ...args: any[]) => any, _: unknown) => {
    return function (this: This, ...args: any[]): any {
      if (this.disposed) {
        throw new Error(message(this));
      }
      return target.call(this, ...args);
    };
  };
}

/**
 * The decorator only invokes the target if the target has not been invoked with
 * the same arguments before. The decorated method throws an error if it's
 * invoked with a different number of elements: if you decorate a method, it
 * should have the same number of arguments
 *
 * @internal
 */
export function invokeAtMostOnceForArguments(
  target: (this: unknown, ...args: any[]) => any,
  _: unknown
): typeof target {
  const cache = new WeakMap();
  let cacheDepth = -1;
  return function (this: unknown, ...args: unknown[]) {
    if (cacheDepth === -1) {
      cacheDepth = args.length;
    }
    if (cacheDepth !== args.length) {
      throw new Error(
        'Memoized method was called with the wrong number of arguments'
      );
    }
    let freshArguments = false;
    let cacheIterator = cache;
    for (const arg of args) {
      if (cacheIterator.has(arg as object)) {
        cacheIterator = cacheIterator.get(arg as object)!;
      } else {
        freshArguments = true;
        cacheIterator.set(arg as object, new WeakMap());
        cacheIterator = cacheIterator.get(arg as object)!;
      }
    }
    if (!freshArguments) {
      return;
    }
    return target.call(this, ...args);
  };
}

export function guarded<T extends object>(
  getKey = function (this: T): object {
    return this;
  }
) {
  return (
    target: (this: T, ...args: any[]) => Promise<any>,
    _: ClassMethodDecoratorContext<T>
  ): typeof target => {
    const mutexes = new WeakMap<object, Mutex>();
    return async function (...args) {
      const key = getKey.call(this);
      let mutex = mutexes.get(key);
      if (!mutex) {
        mutex = new Mutex();
        mutexes.set(key, mutex);
      }
      await using _ = await mutex.acquire();
      return await target.call(this, ...args);
    };
  };
}
