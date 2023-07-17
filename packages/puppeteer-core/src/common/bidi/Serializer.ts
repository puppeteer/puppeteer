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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {LazyArg} from '../LazyArg.js';
import {debugError, isDate, isPlainObject, isRegExp} from '../util.js';

import {BrowsingContext} from './BrowsingContext.js';
import {ElementHandle} from './ElementHandle.js';
import {JSHandle} from './JSHandle.js';

/**
 * @internal
 */
class UnserializableError extends Error {}

/**
 * @internal
 */
export class BidiSerializer {
  static serializeNumber(arg: number): Bidi.CommonDataTypes.LocalValue {
    let value: Bidi.CommonDataTypes.SpecialNumber | number;
    if (Object.is(arg, -0)) {
      value = '-0';
    } else if (Object.is(arg, Infinity)) {
      value = 'Infinity';
    } else if (Object.is(arg, -Infinity)) {
      value = '-Infinity';
    } else if (Object.is(arg, NaN)) {
      value = 'NaN';
    } else {
      value = arg;
    }
    return {
      type: 'number',
      value,
    };
  }

  static serializeObject(arg: object | null): Bidi.CommonDataTypes.LocalValue {
    if (arg === null) {
      return {
        type: 'null',
      };
    } else if (Array.isArray(arg)) {
      const parsedArray = arg.map(subArg => {
        return BidiSerializer.serializeRemoveValue(subArg);
      });

      return {
        type: 'array',
        value: parsedArray,
      };
    } else if (isPlainObject(arg)) {
      try {
        JSON.stringify(arg);
      } catch (error) {
        if (
          error instanceof TypeError &&
          error.message.startsWith('Converting circular structure to JSON')
        ) {
          error.message += ' Recursive objects are not allowed.';
        }
        throw error;
      }

      const parsedObject: Bidi.CommonDataTypes.MappingLocalValue = [];
      for (const key in arg) {
        parsedObject.push([
          BidiSerializer.serializeRemoveValue(key),
          BidiSerializer.serializeRemoveValue(arg[key]),
        ]);
      }

      return {
        type: 'object',
        value: parsedObject,
      };
    } else if (isRegExp(arg)) {
      return {
        type: 'regexp',
        value: {
          pattern: arg.source,
          flags: arg.flags,
        },
      };
    } else if (isDate(arg)) {
      return {
        type: 'date',
        value: arg.toISOString(),
      };
    }

    throw new UnserializableError(
      'Custom object sterilization not possible. Use plain objects instead.'
    );
  }

  static serializeRemoveValue(arg: unknown): Bidi.CommonDataTypes.LocalValue {
    switch (typeof arg) {
      case 'symbol':
      case 'function':
        throw new UnserializableError(`Unable to serializable ${typeof arg}`);
      case 'object':
        return BidiSerializer.serializeObject(arg);

      case 'undefined':
        return {
          type: 'undefined',
        };
      case 'number':
        return BidiSerializer.serializeNumber(arg);
      case 'bigint':
        return {
          type: 'bigint',
          value: arg.toString(),
        };
      case 'string':
        return {
          type: 'string',
          value: arg,
        };
      case 'boolean':
        return {
          type: 'boolean',
          value: arg,
        };
    }
  }

  static async serialize(
    arg: unknown,
    context: BrowsingContext
  ): Promise<
    Bidi.CommonDataTypes.LocalValue | Bidi.CommonDataTypes.RemoteValue
  > {
    if (arg instanceof LazyArg) {
      arg = await arg.get(context);
    }
    const objectHandle =
      arg && (arg instanceof JSHandle || arg instanceof ElementHandle)
        ? arg
        : null;
    if (objectHandle) {
      if (
        objectHandle.context() !== context &&
        !('sharedId' in objectHandle.remoteValue())
      ) {
        throw new Error(
          'JSHandles can be evaluated only in the context they were created!'
        );
      }
      if (objectHandle.disposed) {
        throw new Error('JSHandle is disposed!');
      }
      return objectHandle.remoteValue();
    }

    return BidiSerializer.serializeRemoveValue(arg);
  }

  static deserializeNumber(
    value: Bidi.CommonDataTypes.SpecialNumber | number
  ): number {
    switch (value) {
      case '-0':
        return -0;
      case 'NaN':
        return NaN;
      case 'Infinity':
        return Infinity;
      case '-Infinity':
        return -Infinity;
      default:
        return value;
    }
  }

  static deserializeLocalValue(
    result: Bidi.CommonDataTypes.RemoteValue
  ): unknown {
    switch (result.type) {
      case 'array':
        // TODO: Check expected output when value is undefined
        return result.value?.map(value => {
          return BidiSerializer.deserializeLocalValue(value);
        });
      case 'set':
        // TODO: Check expected output when value is undefined
        return result.value.reduce((acc: Set<unknown>, value) => {
          return acc.add(BidiSerializer.deserializeLocalValue(value));
        }, new Set());
      case 'object':
        if (result.value) {
          return result.value.reduce((acc: Record<any, unknown>, tuple) => {
            const {key, value} = BidiSerializer.deserializeTuple(tuple);
            acc[key as any] = value;
            return acc;
          }, {});
        }
        break;

      case 'map':
        return result.value.reduce((acc: Map<unknown, unknown>, tuple) => {
          const {key, value} = BidiSerializer.deserializeTuple(tuple);
          return acc.set(key, value);
        }, new Map());
      case 'promise':
        return {};
      case 'regexp':
        return new RegExp(result.value.pattern, result.value.flags);
      case 'date':
        return new Date(result.value);

      case 'undefined':
        return undefined;
      case 'null':
        return null;
      case 'number':
        return BidiSerializer.deserializeNumber(result.value);
      case 'bigint':
        return BigInt(result.value);
      case 'boolean':
        return Boolean(result.value);
      case 'string':
        return result.value;
    }

    throw new UnserializableError(
      `Deserialization of type ${result.type} not supported.`
    );
  }

  static deserializeTuple([serializedKey, serializedValue]: [
    Bidi.CommonDataTypes.RemoteValue | string,
    Bidi.CommonDataTypes.RemoteValue,
  ]): {key: unknown; value: unknown} {
    const key =
      typeof serializedKey === 'string'
        ? serializedKey
        : BidiSerializer.deserializeLocalValue(serializedKey);
    const value = BidiSerializer.deserializeLocalValue(serializedValue);

    return {key, value};
  }

  static deserialize(result: Bidi.CommonDataTypes.RemoteValue): any {
    if (!result) {
      debugError('Service did not produce a result.');
      return undefined;
    }

    try {
      return BidiSerializer.deserializeLocalValue(result);
    } catch (error) {
      if (error instanceof UnserializableError) {
        debugError(error.message);
        return undefined;
      }
      throw error;
    }
  }
}
