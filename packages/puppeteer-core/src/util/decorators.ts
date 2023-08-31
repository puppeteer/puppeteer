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

import {Symbol} from '../../third_party/disposablestack/disposablestack.js';
import {Disposed, Moveable} from '../common/types.js';

const instances = new WeakSet<object>();

export function moveable<
  Class extends abstract new (...args: never[]) => Moveable,
>(Class: Class, _: ClassDecoratorContext<Class>): Class {
  let hasDispose = false;
  if (Class.prototype[Symbol.dispose]) {
    const dispose = Class.prototype[Symbol.dispose];
    Class.prototype[Symbol.dispose] = function (this: InstanceType<Class>) {
      if (instances.has(this)) {
        instances.delete(this);
        return;
      }
      return dispose.call(this);
    };
    hasDispose = true;
  }
  if (Class.prototype[Symbol.asyncDispose]) {
    const asyncDispose = Class.prototype[Symbol.asyncDispose];
    Class.prototype[Symbol.asyncDispose] = function (
      this: InstanceType<Class>
    ) {
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

export function throwIfDisposed(message?: string) {
  return <This extends Disposed, Args extends unknown[], Ret>(
    target: (this: This, ...args: Args) => Ret,
    _: unknown
  ) => {
    return function (this: This, ...args: Args): Ret {
      if (this.disposed) {
        throw new Error(
          message ?? `Attempted to use disposed ${this.constructor.name}.`
        );
      }
      return target.call(this, ...args);
    };
  };
}
